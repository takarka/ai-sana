import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppLanguage, AuthApi, I18nService, SessionStore, TranslatePipe, PLATFORM_ROLES } from '@front/core';

// Общая оболочка контура platform (план 09 §4.1, F0.2) — сайдбар + топбар,
// макет docs/plan/10-admin-panel-dizayn.html, экран 2 (AdminLayout.dc.html).
@Component({
  selector: 'app-shell-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.layout.html',
  styleUrl: './shell.layout.scss',
})
export class ShellLayout {
  protected readonly session = inject(SessionStore);
  protected readonly i18n = inject(I18nService);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly initials = computed(() => {
    const fullName = this.session.profile()?.fullName ?? '';
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  protected readonly roleLabelKey = computed(() =>
    this.session.hasRole(PLATFORM_ROLES.SuperAdmin) ? 'shell.role.superadmin' : 'shell.role.author',
  );

  protected readonly canSeeOrgs = computed(() => this.session.hasRole(PLATFORM_ROLES.SuperAdmin));

  protected switchLanguage(language: AppLanguage): void {
    this.i18n.setLanguage(language);
  }

  protected logout(): void {
    this.authApi.logout().subscribe(() => void this.router.navigateByUrl('/auth/login'));
  }
}
