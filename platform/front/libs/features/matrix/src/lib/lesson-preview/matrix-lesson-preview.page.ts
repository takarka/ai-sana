import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LessonDetailsResponse, MatrixApi, QuestionDraft, TranslatePipe, questionDraftFromDto } from '@front/core';
import { CraftEmptyState, CraftQuestionPreview } from '@front/ui';

interface PreviewStep {
  readonly id: string;
  readonly type: 'Theory' | 'Task';
  readonly materials: LessonDetailsResponse['steps'][number]['materials'];
  readonly questionDraft: QuestionDraft | null;
  readonly questionNumber: number;
}

// Предпросмотр урока «глазами ученика» — план 09 §4.4, F3.5: те же материалы и
// задания, что видны в редакторе, но без чекбоксов/подсказок автора и без
// эталонных ответов (CraftQuestionPreview прячет их намеренно). Отдельная
// страница, а не режим в редакторе — предпросмотр смотрит на уже сохранённые
// шаги (GetLesson), а не на несохранённый черновик формы.
@Component({
  selector: 'app-matrix-lesson-preview-page',
  imports: [CraftEmptyState, CraftQuestionPreview, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matrix-lesson-preview.page.html',
  styleUrl: './matrix-lesson-preview.page.scss',
})
export class MatrixLessonPreviewPage {
  private readonly matrixApi = inject(MatrixApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly lessonId = this.route.snapshot.paramMap.get('lessonId') ?? '';

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly lesson = signal<LessonDetailsResponse | null>(null);

  protected readonly steps = computed<readonly PreviewStep[]>(() => {
    const lesson = this.lesson();
    if (!lesson) return [];

    let taskCount = 0;
    return lesson.steps.map((step) => ({
      id: step.id,
      type: step.type,
      materials: step.materials,
      questionDraft: step.question ? questionDraftFromDto(step.question) : null,
      questionNumber: step.type === 'Task' ? taskCount++ : -1,
    }));
  });

  constructor() {
    if (!this.lessonId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

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

  protected backToEditor(): void {
    void this.router.navigateByUrl(`/platform/content/matrix/lessons/${this.lessonId}`);
  }
}
