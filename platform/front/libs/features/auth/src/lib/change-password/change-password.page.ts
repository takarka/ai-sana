import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApi, SessionStore, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput } from '@front/ui';
import { finalize } from 'rxjs';

// Обязательная смена пароля при первом входе (план 09 §4.2, F1.7; backend —
// ChangePasswordHandler отзывает все сессии и refresh-cookie при успехе,
// поэтому после смены пользователь обязан войти заново).
@Component({
  selector: 'app-change-password-page',
  imports: [ReactiveFormsModule, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password.page.html',
  styleUrl: './change-password.page.scss',
})
export class ChangePasswordPage {
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorKey.set(null);
    this.submitting.set(true);

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authApi
      .changePassword(currentPassword, newPassword)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.session.clear();
          void this.router.navigate(['/auth/login'], {
            queryParams: { passwordChanged: '1' },
          });
        },
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}
