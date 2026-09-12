import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  I18nService,
  LessonDetailsResponse,
  LessonStepDto,
  MaterialInput,
  MatrixApi,
  QuestionDraft,
  QuestionDto,
  StepMaterialDto,
  StepMaterialType,
  TranslatePipe,
  createQuestionDraft,
  errorTranslationKey,
  questionDraftFromDto,
  questionDraftToInput,
  validateQuestionDraft,
} from '@front/core';
import { CraftButton, CraftEmptyState, CraftQuestionEditor } from '@front/ui';
import { finalize } from 'rxjs';
import { openEditLessonDialog } from '../dialogs/edit-lesson/edit-lesson.dialog';

const MATERIAL_TYPES: readonly StepMaterialType[] = ['Text', 'Video', 'Image', 'File'];

function emptyMaterial(): MaterialInput {
  return { type: 'Text', content: '' };
}

// Наполнение урока контентом — план 09 §4.4, F3.3-F3.4: материалы (видео,
// текст, изображение, файлы) и задания закрытого типа (восемь типов, план 06
// §2). Полноценная страница, а не модалка — полей и повторяющихся блоков
// достаточно, чтобы модалка стала неудобной. Уже сохранённые шаги можно
// редактировать (в тот же блок формы, что и добавление), удалять и
// переупорядочивать стрелками — переупорядочивание отправляется на сервер
// целиком (ReorderSteps), а не одним смещением, чтобы не разъезжаться с
// позициями, которые бэкенд хранит как источник истины.
@Component({
  selector: 'app-matrix-lesson-editor-page',
  imports: [DialogModule, FormsModule, RouterLink, CraftButton, CraftEmptyState, CraftQuestionEditor, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matrix-lesson-editor.page.html',
  styleUrl: './matrix-lesson-editor.page.scss',
})
export class MatrixLessonEditorPage {
  private readonly matrixApi = inject(MatrixApi);
  private readonly dialog = inject(Dialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  private readonly lessonId = this.route.snapshot.paramMap.get('lessonId') ?? '';

  protected readonly materialTypes = MATERIAL_TYPES;

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly lesson = signal<LessonDetailsResponse | null>(null);

  protected readonly materialDrafts = signal<MaterialInput[]>([emptyMaterial()]);
  protected readonly materialsSubmitting = signal(false);
  protected readonly materialsErrorKey = signal<string | null>(null);

  protected readonly questionDraft = signal<QuestionDraft>(createQuestionDraft());
  protected readonly questionValidationError = signal<string | null>(null);
  protected readonly questionSubmitting = signal(false);
  protected readonly questionErrorKey = signal<string | null>(null);

  // --- Редактирование/удаление/переупорядочивание уже сохранённых шагов ---
  protected readonly editingStepId = signal<string | null>(null);
  protected readonly editingMaterials = signal<MaterialInput[]>([]);
  protected readonly editingQuestion = signal<QuestionDraft>(createQuestionDraft());
  protected readonly editingErrorKey = signal<string | null>(null);
  protected readonly editingValidationError = signal<string | null>(null);
  protected readonly stepActionPending = signal(false);
  protected readonly stepActionErrorKey = signal<string | null>(null);

  constructor() {
    if (!this.lessonId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.fetch();
  }

  protected renameLesson(): void {
    const lesson = this.lesson();
    if (!lesson) return;

    openEditLessonDialog(this.dialog, { lessonId: lesson.id, title: lesson.title }).closed.subscribe((updated) => {
      if (updated) this.lesson.set({ ...lesson, title: updated.title });
    });
  }

  protected backToList(): void {
    void this.router.navigateByUrl('/platform/content/matrix');
  }

  protected openPreview(): void {
    void this.router.navigateByUrl(`/platform/content/matrix/lessons/${this.lessonId}/preview`);
  }

  // --- Материалы ---

  protected setMaterialType(index: number, type: StepMaterialType): void {
    this.materialDrafts.update((rows) => rows.map((row, i) => (i === index ? { ...row, type } : row)));
  }

  protected setMaterialContent(index: number, content: string): void {
    this.materialDrafts.update((rows) => rows.map((row, i) => (i === index ? { ...row, content } : row)));
  }

  protected addMaterialRow(): void {
    this.materialDrafts.update((rows) => [...rows, emptyMaterial()]);
  }

  protected removeMaterialRow(index: number): void {
    this.materialDrafts.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected submitMaterials(): void {
    if (this.materialsSubmitting()) return;

    const materials = this.materialDrafts().map((row) => ({ ...row, content: row.content.trim() }));
    if (materials.length === 0) {
      this.materialsErrorKey.set('errors.theory-step.materials-required');
      return;
    }

    if (materials.some((row) => row.content.length === 0)) {
      this.materialsErrorKey.set('errors.theory-step.material-content-required');
      return;
    }

    this.materialsErrorKey.set(null);
    this.materialsSubmitting.set(true);

    this.matrixApi
      .addTheoryStep(this.lessonId, materials)
      .pipe(finalize(() => this.materialsSubmitting.set(false)))
      .subscribe({
        next: (step) => {
          this.appendStep(step);
          this.materialDrafts.set([emptyMaterial()]);
        },
        error: (error: unknown) => this.materialsErrorKey.set(errorTranslationKey(error)),
      });
  }

  // --- Задание ---

  protected submitQuestion(): void {
    if (this.questionSubmitting()) return;

    const draft = this.questionDraft();
    const validationError = validateQuestionDraft(draft, 0);
    if (validationError) {
      this.questionValidationError.set(validationError);
      return;
    }

    this.questionValidationError.set(null);
    this.questionErrorKey.set(null);
    this.questionSubmitting.set(true);

    this.matrixApi
      .addTaskStep(this.lessonId, questionDraftToInput(draft))
      .pipe(finalize(() => this.questionSubmitting.set(false)))
      .subscribe({
        next: (step) => {
          this.appendStep(step);
          this.questionDraft.set(createQuestionDraft());
        },
        error: (error: unknown) => this.questionErrorKey.set(errorTranslationKey(error)),
      });
  }

  // --- Редактирование уже сохранённого шага ---

  protected isEditingStep(stepId: string): boolean {
    return this.editingStepId() === stepId;
  }

  protected startEditStep(step: LessonStepDto): void {
    this.editingErrorKey.set(null);
    this.editingValidationError.set(null);

    if (step.type === 'Theory') {
      this.editingMaterials.set((step.materials ?? []).map((m) => ({ type: m.type, content: m.content })));
    } else if (step.question) {
      this.editingQuestion.set(questionDraftFromDto(step.question));
    }

    this.editingStepId.set(step.id);
  }

  protected cancelEditStep(): void {
    this.editingStepId.set(null);
    this.editingErrorKey.set(null);
    this.editingValidationError.set(null);
  }

  protected setEditingMaterialType(index: number, type: StepMaterialType): void {
    this.editingMaterials.update((rows) => rows.map((row, i) => (i === index ? { ...row, type } : row)));
  }

  protected setEditingMaterialContent(index: number, content: string): void {
    this.editingMaterials.update((rows) => rows.map((row, i) => (i === index ? { ...row, content } : row)));
  }

  protected addEditingMaterialRow(): void {
    this.editingMaterials.update((rows) => [...rows, emptyMaterial()]);
  }

  protected removeEditingMaterialRow(index: number): void {
    this.editingMaterials.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected saveEditedTheoryStep(stepId: string): void {
    const materials = this.editingMaterials().map((row) => ({ ...row, content: row.content.trim() }));
    if (materials.length === 0) {
      this.editingErrorKey.set('errors.theory-step.materials-required');
      return;
    }
    if (materials.some((row) => row.content.length === 0)) {
      this.editingErrorKey.set('errors.theory-step.material-content-required');
      return;
    }

    this.editingErrorKey.set(null);
    this.stepActionPending.set(true);

    this.matrixApi
      .updateTheoryStep(this.lessonId, stepId, { materials })
      .pipe(finalize(() => this.stepActionPending.set(false)))
      .subscribe({
        next: (step) => {
          this.replaceStep(step);
          this.editingStepId.set(null);
        },
        error: (error: unknown) => this.editingErrorKey.set(errorTranslationKey(error)),
      });
  }

  protected saveEditedTaskStep(stepId: string): void {
    const draft = this.editingQuestion();
    const validationError = validateQuestionDraft(draft, 0);
    if (validationError) {
      this.editingValidationError.set(validationError);
      return;
    }

    this.editingValidationError.set(null);
    this.editingErrorKey.set(null);
    this.stepActionPending.set(true);

    this.matrixApi
      .updateTaskStep(this.lessonId, stepId, questionDraftToInput(draft))
      .pipe(finalize(() => this.stepActionPending.set(false)))
      .subscribe({
        next: (step) => {
          this.replaceStep(step);
          this.editingStepId.set(null);
        },
        error: (error: unknown) => this.editingErrorKey.set(errorTranslationKey(error)),
      });
  }

  // --- Удаление и порядок шагов ---

  protected deleteStep(step: LessonStepDto): void {
    if (this.stepActionPending()) return;
    if (!confirm(this.i18n.translate('matrix.lessonEditor.confirmDelete'))) return;

    this.stepActionErrorKey.set(null);
    this.stepActionPending.set(true);

    this.matrixApi
      .deleteStep(this.lessonId, step.id)
      .pipe(finalize(() => this.stepActionPending.set(false)))
      .subscribe({
        next: () => {
          const lesson = this.lesson();
          if (!lesson) return;
          this.lesson.set({ ...lesson, steps: lesson.steps.filter((s) => s.id !== step.id) });
          if (this.editingStepId() === step.id) this.editingStepId.set(null);
        },
        error: (error: unknown) => this.stepActionErrorKey.set(errorTranslationKey(error)),
      });
  }

  protected canMoveStepUp(index: number): boolean {
    return index > 0;
  }

  protected canMoveStepDown(index: number): boolean {
    const lesson = this.lesson();
    return !!lesson && index < lesson.steps.length - 1;
  }

  protected moveStepUp(index: number): void {
    this.swapSteps(index, index - 1);
  }

  protected moveStepDown(index: number): void {
    this.swapSteps(index, index + 1);
  }

  private swapSteps(a: number, b: number): void {
    if (this.stepActionPending()) return;

    const lesson = this.lesson();
    if (!lesson || b < 0 || b >= lesson.steps.length) return;

    const steps = [...lesson.steps];
    [steps[a], steps[b]] = [steps[b], steps[a]];

    const previousSteps = lesson.steps;
    this.lesson.set({ ...lesson, steps });
    this.stepActionErrorKey.set(null);
    this.stepActionPending.set(true);

    this.matrixApi
      .reorderSteps(this.lessonId, { stepIds: steps.map((s) => s.id) })
      .pipe(finalize(() => this.stepActionPending.set(false)))
      .subscribe({
        error: (error: unknown) => {
          // Откатываем локальный порядок — сервер порядок не принял.
          this.lesson.set({ ...lesson, steps: previousSteps });
          this.stepActionErrorKey.set(errorTranslationKey(error));
        },
      });
  }

  // --- Просмотр уже сохранённых шагов ---

  protected describeMaterial(material: StepMaterialDto): string {
    return material.content.length > 160 ? `${material.content.slice(0, 160)}…` : material.content;
  }

  protected describeQuestion(question: QuestionDto): string {
    const payload = question.payload as Record<string, unknown>;
    switch (question.type) {
      case 'SingleChoice':
      case 'MultipleChoice':
        return (payload['options'] as string[]).join(' · ');
      case 'Matching':
        return `${(payload['left'] as string[]).join(', ')} → ${(payload['right'] as string[]).join(', ')}`;
      case 'Ordering':
        return (payload['items'] as string[]).join(' → ');
      case 'FillInBlank':
        return payload['text'] as string;
      case 'NumericTolerance':
      case 'ShortText':
        return payload['question'] as string;
      case 'DragAndDrop':
        return (payload['items'] as string[]).join(', ');
    }
  }

  private fetch(): void {
    this.loading.set(true);
    this.matrixApi.getLesson(this.lessonId).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private appendStep(step: LessonStepDto): void {
    const lesson = this.lesson();
    if (!lesson) return;
    this.lesson.set({ ...lesson, steps: [...lesson.steps, step] });
  }

  private replaceStep(step: LessonStepDto): void {
    const lesson = this.lesson();
    if (!lesson) return;
    this.lesson.set({ ...lesson, steps: lesson.steps.map((s) => (s.id === step.id ? step : s)) });
  }
}
