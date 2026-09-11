import { Injectable, computed, signal } from '@angular/core';
import { SessionProfile } from './session.model';

// Access-токен и профиль живут только в памяти (план 09 §4.2, F1.3) — refresh
// приходит httpOnly-cookie'й, а не отсюда. Перезагрузка страницы теряет этот
// стор целиком; его восстанавливает AuthApi.hydrateFromRefreshCookie$() при
// старте приложения (APP_INITIALIZER в apps/admin).
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly profileSignal = signal<SessionProfile | null>(null);

  readonly profile = this.profileSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);
  readonly roles = computed<readonly string[]>(() => this.profileSignal()?.roles ?? []);
  readonly mustChangePassword = computed(() => this.profileSignal()?.mustChangePassword ?? false);

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  setAccessToken(accessToken: string): void {
    this.accessTokenSignal.set(accessToken);
  }

  // Login/Refresh отдают роли и mustChangePassword ещё до того, как загружен
  // полный профиль через /me — сохраняем частично, GetCurrentUser достроит остальное.
  applyAuthResult(accessToken: string, roles: readonly string[], mustChangePassword: boolean): void {
    this.accessTokenSignal.set(accessToken);
    this.profileSignal.update((current) =>
      current
        ? { ...current, roles, mustChangePassword }
        : { id: '', email: '', fullName: '', preferredLanguage: 'ru', roles, mustChangePassword },
    );
  }

  setProfile(profile: SessionProfile): void {
    this.profileSignal.set(profile);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: readonly string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  clear(): void {
    this.accessTokenSignal.set(null);
    this.profileSignal.set(null);
  }
}
