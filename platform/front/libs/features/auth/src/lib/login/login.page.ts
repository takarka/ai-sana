import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApi, TranslatePipe, errorTranslationKey } from '@front/core';
import { CraftButton, CraftInput } from '@front/ui';
import { finalize, switchMap } from 'rxjs';

// Экран входа — макет docs/plan/10-admin-panel-dizayn.html, экран 1
// (Main.dc.html). Email/пароль, JWT (план 09, A1).
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, CraftInput, CraftButton, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorKey.set(null);
    this.submitting.set(true);

    const { email, password } = this.form.getRawValue();

    this.authApi
      .login(email, password)
      .pipe(
        switchMap(() => this.authApi.me()),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (profile) => {
          if (profile.mustChangePassword) {
            void this.router.navigateByUrl('/auth/change-password');
            return;
          }
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/platform');
        },
        error: (error: unknown) => this.errorKey.set(errorTranslationKey(error)),
      });
  }
}
