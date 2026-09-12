import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LessonResponse, MatrixApi, SectionResponse, TranslatePipe } from '@front/core';
import { CraftButton, CraftEmptyState } from '@front/ui';
import { forkJoin } from 'rxjs';
import { openCreateLessonDialog } from '../dialogs/create-lesson/create-lesson.dialog';
import { openCreateSectionDialog } from '../dialogs/create-section/create-section.dialog';

const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

// «Разделы и уроки» — дерево MATRIX: раздел → уроки, фильтр по параллели
// (план 09 §4.4, F3.1-F3.2). Редактор материалов и заданий шага (F3.3-F3.4)
// сознательно вне этого среза — здесь только структура банка уроков.
@Component({
  selector: 'app-matrix-content-page',
  imports: [DialogModule, DatePipe, CraftButton, CraftEmptyState, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matrix-content.page.html',
  styleUrl: './matrix-content.page.scss',
})
export class MatrixContentPage {
  private readonly matrixApi = inject(MatrixApi);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);

  protected readonly grades = GRADES;
  protected readonly loading = signal(true);
  protected readonly gradeFilter = signal(0);
  protected readonly sections = signal<readonly SectionResponse[]>([]);
  protected readonly lessons = signal<readonly LessonResponse[]>([]);

  protected readonly lessonsBySectionId = computed(() => {
    const map = new Map<string, LessonResponse[]>();
    for (const lesson of this.lessons()) {
      const group = map.get(lesson.sectionId);
      if (group) {
        group.push(lesson);
      } else {
        map.set(lesson.sectionId, [lesson]);
      }
    }
    return map;
  });

  constructor() {
    this.fetch();
  }

  protected setGradeFilter(grade: number): void {
    this.gradeFilter.set(grade);
    this.fetch();
  }

  protected createSection(): void {
    openCreateSectionDialog(this.dialog).closed.subscribe((created) => {
      if (created) this.fetch();
    });
  }

  protected addLesson(section: SectionResponse): void {
    openCreateLessonDialog(this.dialog, { sectionId: section.id, sectionName: section.name }).closed.subscribe(
      (created) => {
        if (created) this.fetch();
      },
    );
  }

  protected openLesson(lesson: LessonResponse): void {
    void this.router.navigate(['/platform/content/matrix/lessons', lesson.id]);
  }

  private fetch(): void {
    this.loading.set(true);
    const grade = this.gradeFilter() || undefined;

    forkJoin({
      sections: this.matrixApi.listSections(grade),
      lessons: this.matrixApi.listLessons({ grade }),
    }).subscribe(({ sections, lessons }) => {
      this.sections.set(sections);
      this.lessons.set(lessons);
      this.loading.set(false);
    });
  }
}
