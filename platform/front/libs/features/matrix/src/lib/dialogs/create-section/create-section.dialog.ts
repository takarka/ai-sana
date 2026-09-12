import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatrixApi, SectionResponse, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

// Модалка «Создать раздел» — план 09 §4.4, F3.1/F3.2: название и параллель,
// без визуального редактора (CreateSection, план 09 §3.4).
@Component({
  selector: 'app-create-section-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-section.dialog.html',
  styleUrl: '../dialog-form.scss',
})
export class CreateSectionDialog {
  private readonly dialogRef = inject(DialogRef<SectionResponse | undefined, CreateSectionDialog>);
  private readonly matrixApi = inject(MatrixApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly grades = GRADES;
  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    grade: [GRADES[0], Validators.required],
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

    const { name, grade } = this.form.getRawValue();

    this.matrixApi
      .createSection({ name, grade: Number(grade) })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openCreateSectionDialog(dialog: Dialog): DialogRef<SectionResponse | undefined, CreateSectionDialog> {
  return dialog.open(CreateSectionDialog, {
    ariaLabelledBy: 'craft-modal-title',
  });
}
