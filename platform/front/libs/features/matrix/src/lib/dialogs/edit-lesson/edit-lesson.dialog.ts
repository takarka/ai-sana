import { Dialog, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LessonResponse, MatrixApi, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

export interface EditLessonDialogData {
  readonly lessonId: string;
  readonly title: string;
}

// Модалка «Переименовать урок» — узкий срез редактора урока (план 09 §4.4,
// F3.2): только название (UpdateLesson, план 09 §3.4). Материалы и задания
// шага (F3.3-F3.4) редактируются вне этого среза.
@Component({
  selector: 'app-edit-lesson-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-lesson.dialog.html',
  styleUrl: '../dialog-form.scss',
})
export class EditLessonDialog {
  private readonly dialogRef = inject(DialogRef<LessonResponse | undefined, EditLessonDialog>);
  private readonly data = inject<EditLessonDialogData>(DIALOG_DATA);
  private readonly matrixApi = inject(MatrixApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    title: [this.data.title, Validators.required],
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
      .updateLesson(this.data.lessonId, { title })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (updated) => this.dialogRef.close(updated),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openEditLessonDialog(
  dialog: Dialog,
  data: EditLessonDialogData,
): DialogRef<LessonResponse | undefined, EditLessonDialog> {
  return dialog.open(EditLessonDialog, {
    ariaLabelledBy: 'craft-modal-title',
    data,
  });
}
