import { Dialog, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LessonResponse, MatrixApi, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

export interface CreateLessonDialogData {
  readonly sectionId: string;
  readonly sectionName: string;
}

// Модалка «Добавить урок» — план 09 §4.4, F3.2: название урока внутри уже
// выбранного раздела (CreateLesson, план 09 §3.4). Публикация не отдельная
// команда — сохранение сразу помечает урок опубликованным (план 06 §5).
@Component({
  selector: 'app-create-lesson-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-lesson.dialog.html',
  styleUrl: '../dialog-form.scss',
})
export class CreateLessonDialog {
  private readonly dialogRef = inject(DialogRef<LessonResponse | undefined, CreateLessonDialog>);
  protected readonly data = inject<CreateLessonDialogData>(DIALOG_DATA);
  private readonly matrixApi = inject(MatrixApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
  });

  protected close(): void {
    this.dialogRef.close(undefined);
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorKey.set(null);
    this.submitting.set(true);

    const { title } = this.form.getRawValue();

    this.matrixApi
      .createLesson({ sectionId: this.data.sectionId, title })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openCreateLessonDialog(
  dialog: Dialog,
  data: CreateLessonDialogData,
): DialogRef<LessonResponse | undefined, CreateLessonDialog> {
  return dialog.open(CreateLessonDialog, {
    ariaLabelledBy: 'craft-modal-title',
    data,
  });
}
