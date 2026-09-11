import { Dialog, DialogModule, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@front/core';
import { CraftButton, CraftModal } from '@front/ui';

export interface CredentialsRevealDialogData {
  readonly login: string;
  readonly password: string;
}

// Логин и сгенерированный пароль показываются один раз (CreateUserAccountResponse —
// платформа хранит только хеш, план 09 §3.3). Дальше их не восстановить, поэтому
// диалог не закрывается кликом мимо — только явным «Готово».
@Component({
  selector: 'app-credentials-reveal-dialog',
  imports: [DialogModule, CraftModal, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './credentials-reveal.dialog.html',
  styleUrl: './credentials-reveal.dialog.scss',
})
export class CredentialsRevealDialog {
  private readonly dialogRef = inject(DialogRef<void, CredentialsRevealDialog>);
  protected readonly data = inject<CredentialsRevealDialogData>(DIALOG_DATA);

  protected readonly copiedField = signal<'login' | 'password' | null>(null);

  protected close(): void {
    this.dialogRef.close();
  }

  protected async copy(field: 'login' | 'password'): Promise<void> {
    try {
      await navigator.clipboard.writeText(field === 'login' ? this.data.login : this.data.password);
      this.copiedField.set(field);
      setTimeout(() => this.copiedField.set(null), 1500);
    } catch {
      // Буфер обмена недоступен (нет разрешения/небезопасный контекст) — пользователь
      // всё равно видит значение на экране и может скопировать вручную.
    }
  }
}

export function openCredentialsRevealDialog(
  dialog: Dialog,
  data: CredentialsRevealDialogData,
): DialogRef<void, CredentialsRevealDialog> {
  return dialog.open(CredentialsRevealDialog, {
    ariaLabelledBy: 'craft-modal-title',
    disableClose: true,
    data,
  });
}
