import { Dialog, DialogModule, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateOrganizationResponse, OrganizationsApi, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput, CraftModal } from '@front/ui';
import { finalize } from 'rxjs';

// Модалка «Создать школу» — макет docs/plan/10-admin-panel-dizayn.html, экран 4
// (CreateSchoolModal.dc.html). Название — единственное обязательное поле,
// учебный год бэкенд создаёт сам (CreateOrganization, план 09 §A2.2).
@Component({
  selector: 'app-create-organization-dialog',
  imports: [DialogModule, ReactiveFormsModule, CraftModal, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-organization.dialog.html',
  styleUrl: '../dialog-form.scss',
})
export class CreateOrganizationDialog {
  private readonly dialogRef = inject(DialogRef<CreateOrganizationResponse | undefined, CreateOrganizationDialog>);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    region: [''],
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

    const { name, region } = this.form.getRawValue();

    this.organizationsApi
      .createOrganization({ name, region: region || null })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => this.dialogRef.close(created),
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}

export function openCreateOrganizationDialog(
  dialog: Dialog,
): DialogRef<CreateOrganizationResponse | undefined, CreateOrganizationDialog> {
  return dialog.open(CreateOrganizationDialog, {
    ariaLabelledBy: 'craft-modal-title',
  });
}
