import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
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
// достаточно, чтобы модалка стала неудобной. Backend умеет только ДОБАВЛЯТЬ
// шаги (AddTheoryStep/AddTaskStep) — ни редактирования, ни удаления, ни
// изменения порядка уже сохранённого шага нет (план 09 §3.4), поэтому
// существующие шаги показаны только для чтения.
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
}
