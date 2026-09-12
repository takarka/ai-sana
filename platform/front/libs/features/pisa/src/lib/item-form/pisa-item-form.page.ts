import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CreateItemRequest,
  PisaApi,
  QuestionDraft,
  TranslatePipe,
  createQuestionDraft,
  errorTranslationKey,
  questionDraftFromDto,
  questionDraftToInput,
  validateQuestionDraft,
} from '@front/core';
import { CraftButton, CraftInput, CraftQuestionEditor, CraftQuestionPreview } from '@front/ui';
import { finalize } from 'rxjs';

const LEVELS = [1, 2, 3, 4, 5, 6];
const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);
const DIRECTIONS = ['Math', 'Science', 'Reading'] as const;

// Страница составного задания PISA — стимул + метаданные + список вопросов
// (план 09 §4.5, F4.2-F4.3: CreateItem/UpdateItem принимают вопросы целиком,
// поэтому одна страница обслуживает и создание, и редактирование —
// itemId из маршрута отличает режимы). Полноэкранная форма вместо модалки:
// у составного задания много полей и вопросов переменной формы, для которых
// фиксированная ширина диалога не годится. Рецензии нет (план 07 О2) —
// сохранение сразу публикует задание.
@Component({
  selector: 'app-pisa-item-form-page',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CraftInput, CraftButton, CraftQuestionEditor, CraftQuestionPreview, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pisa-item-form.page.html',
  styleUrls: ['./item-form.scss', './pisa-item-form.page.scss'],
})
export class PisaItemFormPage {
  private readonly pisaApi = inject(PisaApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly itemId = this.route.snapshot.paramMap.get('itemId');

  protected readonly isEdit = !!this.itemId;
  protected readonly levels = LEVELS;
  protected readonly grades = GRADES;
  protected readonly directions = DIRECTIONS;

  protected readonly loading = signal(this.isEdit);
  protected readonly notFound = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly formErrors = signal<string[]>([]);

  protected readonly sources = signal<string[]>([]);
  protected readonly questions = signal<QuestionDraft[]>([createQuestionDraft()]);
  protected readonly questionErrors = signal<Readonly<Record<string, string | null>>>({});

  // Предпросмотр «глазами ученика» (план 09 §4.5, F4.4) — переключатель поверх
  // того же черновика формы, а не отдельный маршрут: составное задание PISA
  // редактируется целиком на одной странице и до сохранения не имеет id,
  // поэтому предпросмотру нечего запрашивать с сервера.
  protected readonly previewMode = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    stimulusText: ['', Validators.required],
    chartUrl: [''],
    direction: [DIRECTIONS[0] as string, Validators.required],
    cognitiveProcess: ['', Validators.required],
    context: ['', Validators.required],
    level: [1, Validators.required],
    expectedTimeMinutes: [15, [Validators.required, Validators.min(1)]],
    gradeRangeMin: [1, Validators.required],
    gradeRangeMax: [11, Validators.required],
  });

  constructor() {
    if (this.itemId) {
      this.pisaApi.getItem(this.itemId).subscribe({
        next: (item) => {
          this.form.setValue({
            stimulusText: item.stimulus.text,
            chartUrl: item.stimulus.chartUrl ?? '',
            direction: item.direction,
            cognitiveProcess: item.cognitiveProcess,
            context: item.context,
            level: item.level,
            expectedTimeMinutes: item.expectedTimeMinutes,
            gradeRangeMin: item.gradeRangeMin,
            gradeRangeMax: item.gradeRangeMax,
          });
          this.sources.set([...(item.stimulus.sources ?? [])]);
          this.questions.set(item.questions.map(questionDraftFromDto));
          this.loading.set(false);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  protected setSource(index: number, value: string): void {
    const sources = [...this.sources()];
    sources[index] = value;
    this.sources.set(sources);
  }

  protected addSource(): void {
    this.sources.set([...this.sources(), '']);
  }

  protected removeSource(index: number): void {
    this.sources.set(this.sources().filter((_, i) => i !== index));
  }

  protected togglePreview(): void {
    this.previewMode.update((value) => !value);
  }

  protected addQuestion(): void {
    this.questions.update((list) => [...list, createQuestionDraft()]);
  }

  protected updateQuestion(index: number, draft: QuestionDraft): void {
    this.questions.update((list) => list.map((item, i) => (i === index ? draft : item)));
  }

  protected removeQuestion(index: number): void {
    this.questions.update((list) => list.filter((_, i) => i !== index));
  }

  protected moveQuestionUp(index: number): void {
    this.swapQuestions(index, index - 1);
  }

  protected moveQuestionDown(index: number): void {
    this.swapQuestions(index, index + 1);
  }

  private swapQuestions(a: number, b: number): void {
    const list = [...this.questions()];
    if (b < 0 || b >= list.length) return;
    [list[a], list[b]] = [list[b], list[a]];
    this.questions.set(list);
  }

  protected submit(): void {
    if (this.submitting()) return;

    const formErrors: string[] = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      formErrors.push('pisa.itemForm.metadataInvalid');
    }

    const gradeRangeMin = Number(this.form.getRawValue().gradeRangeMin);
    const gradeRangeMax = Number(this.form.getRawValue().gradeRangeMax);
    if (gradeRangeMin > gradeRangeMax) {
      formErrors.push('pisa.itemForm.gradeRangeInvalid');
    }

    if (this.questions().length === 0) {
      formErrors.push('pisa.itemForm.questionsRequired');
    }

    const questionErrors: Record<string, string | null> = {};
    let hasQuestionError = false;
    this.questions().forEach((draft, index) => {
      const error = validateQuestionDraft(draft, index);
      questionErrors[draft.key] = error;
      if (error) hasQuestionError = true;
    });
    this.questionErrors.set(questionErrors);

    if (formErrors.length > 0 || hasQuestionError) {
      this.formErrors.set(formErrors);
      return;
    }

    this.formErrors.set([]);
    this.errorKey.set(null);
    this.submitting.set(true);

    const { stimulusText, chartUrl, direction, cognitiveProcess, context, level, expectedTimeMinutes } =
      this.form.getRawValue();
    const sources = this.sources().map((s) => s.trim()).filter((s) => s.length > 0);

    const request: CreateItemRequest = {
      stimulus: { text: stimulusText, chartUrl: chartUrl.trim() || null, sources: sources.length > 0 ? sources : null },
      direction,
      cognitiveProcess,
      context,
      level: Number(level),
      expectedTimeMinutes: Number(expectedTimeMinutes),
      gradeRangeMin,
      gradeRangeMax,
      questions: this.questions().map(questionDraftToInput),
    };

    const request$ = this.itemId ? this.pisaApi.updateItem(this.itemId, request) : this.pisaApi.createItem(request);

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/platform/content/pisa'),
      error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
    });
  }
}
