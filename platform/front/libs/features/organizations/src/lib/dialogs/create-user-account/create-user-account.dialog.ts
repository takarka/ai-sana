import { Dialog, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ClassGroupResponse,
  CreateUserAccountResponse,
  OrganizationMemberRole,
  OrganizationsApi,
  TranslatePipe,
  errorTranslationKey,
} from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

export interface CreateUserAccountDialogData {
  readonly orgId: string;
  readonly classGroups: readonly ClassGroupResponse[];
}

// Модалка «Добавить пользователя» — план 09 §4.3, F2.5. Ученику класс
// обязателен (план 08 О2), учителю поле класса не показывается вовсе.
@Component({
  selector: 'app-create-user-account-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-user-account.dialog.html',
  styleUrl: '../dialog-form.scss',
})
export class CreateUserAccountDialog {
  private readonly dialogRef = inject(DialogRef<CreateUserAccountResponse | undefined, CreateUserAccountDialog>);
  protected readonly data = inject<CreateUserAccountDialogData>(DIALOG_DATA);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', Validators.required],
    role: ['student' as OrganizationMemberRole, Validators.required],
    classGroupId: [''],
  });

  // Не computed(): FormControl.value не сигнал, а шаблон перевызывает метод на
  // каждом цикле CD, который (change) селекта роли и так запускает.
  protected isStudent(): boolean {
    return this.form.controls.role.value === 'student';
  }

  protected close(): void {
    this.dialogRef.close(undefined);
  }

  protected submit(): void {
    const { fullName, role, classGroupId } = this.form.getRawValue();

    if (this.form.controls.fullName.invalid || (role === 'student' && !classGroupId) || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorKey.set(null);
    this.submitting.set(true);

    this.organizationsApi
      .createUserAccount(this.data.orgId, {
        fullName,
        role,
        classGroupId: role === 'student' ? classGroupId : null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openCreateUserAccountDialog(
  dialog: Dialog,
  data: CreateUserAccountDialogData,
): DialogRef<CreateUserAccountResponse | undefined, CreateUserAccountDialog> {
  return dialog.open(CreateUserAccountDialog, {
    ariaLabelledBy: 'craft-modal-title',
    data,
  });
}
