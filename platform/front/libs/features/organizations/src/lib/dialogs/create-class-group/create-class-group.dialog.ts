import { Dialog, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassGroupResponse, OrganizationsApi, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

export interface CreateClassGroupDialogData {
  readonly orgId: string;
}

const GRADES = Array.from({ length: 11 }, (_, index) => index + 1);

// Модалка «Добавить класс» — план 09 §4.3, F2.3 (панель школы, макет
// docs/plan/10-admin-panel-dizayn.html, экран 3, «Добавить» у чипов классов).
@Component({
  selector: 'app-create-class-group-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-class-group.dialog.html',
  styleUrl: '../dialog-form.scss',
})
export class CreateClassGroupDialog {
  private readonly dialogRef = inject(DialogRef<ClassGroupResponse | undefined, CreateClassGroupDialog>);
  private readonly data = inject<CreateClassGroupDialogData>(DIALOG_DATA);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly grades = GRADES;
  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    grade: [GRADES[0], Validators.required],
    letter: ['', Validators.required],
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

    const { grade, letter } = this.form.getRawValue();

    this.organizationsApi
      .createClassGroup(this.data.orgId, { grade: Number(grade), letter })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openCreateClassGroupDialog(
  dialog: Dialog,
  data: CreateClassGroupDialogData,
): DialogRef<ClassGroupResponse | undefined, CreateClassGroupDialog> {
  return dialog.open(CreateClassGroupDialog, {
    ariaLabelledBy: 'craft-modal-title',
    data,
  });
}
