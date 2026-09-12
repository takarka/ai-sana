import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthorsApi, CreateAuthorAccountResponse, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

// Модалка «Создать методиста» — по образцу create-organization.dialog
// (план 08 §2: методист платформы не привязан к организации). В отличие от
// учителя/ученика (CreateUserAccount) у методиста есть настоящая почта —
// её вводит админ, и она становится логином напрямую, без синтетического
// адреса со случайным суффиксом. Пароль по-прежнему генерируется.
@Component({
  selector: 'app-create-author-account-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-author-account.dialog.html',
  styleUrl: './create-author-account.dialog.scss',
})
export class CreateAuthorAccountDialog {
  private readonly dialogRef = inject(DialogRef<CreateAuthorAccountResponse | undefined, CreateAuthorAccountDialog>);
  private readonly authorsApi = inject(AuthorsApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
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

    const { fullName, email } = this.form.getRawValue();

    this.authorsApi
      .createAuthorAccount({ fullName, email })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openCreateAuthorAccountDialog(
  dialog: Dialog,
): DialogRef<CreateAuthorAccountResponse | undefined, CreateAuthorAccountDialog> {
  return dialog.open(CreateAuthorAccountDialog, {
    ariaLabelledBy: 'craft-modal-title',
  });
}
