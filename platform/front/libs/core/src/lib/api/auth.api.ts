import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url.token';
import { idempotencyHeader } from '../http/idempotency';
import { SessionProfile } from '../session/session.model';
import { SessionStore } from '../session/session.store';

// Зеркало CraftAi.Modules.Identity.Features.Authentication.AuthTokenResponse.
export interface AuthTokenResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAtUtc: string;
  readonly mustChangePassword: boolean;
  readonly roles: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly session = inject(SessionStore);

  // Дедупликация одновременных 401 от нескольких запросов — общий inflight
  // refresh вместо гонки нескольких /auth/refresh (план 09 §4.2, F1.3).
  private refreshInFlight$: Observable<AuthTokenResponse> | null = null;

  login(email: string, password: string): Observable<AuthTokenResponse> {
    return this.http
      .post<AuthTokenResponse>(
        `${this.apiBaseUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(tap((response) => this.applyTokenResponse(response)));
  }

  refreshOnce$(): Observable<AuthTokenResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const request$ = this.http
      .post<AuthTokenResponse>(`${this.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.applyTokenResponse(response)),
        catchError((error: unknown) => {
          this.session.clear();
          return throwError(() => error);
        }),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
      );

    this.refreshInFlight$ = request$;
    return request$;
  }

  // Вызывается один раз при старте приложения — молча восстанавливает сессию
  // из refresh-cookie, если она есть, иначе оставляет пользователя анонимным.
  hydrateFromRefreshCookie$(): Observable<boolean> {
    return this.refreshOnce$().pipe(
      switchMap(() => this.me()),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  me(): Observable<SessionProfile> {
    return this.http
      .get<SessionProfile>(`${this.apiBaseUrl}/me`)
      .pipe(tap((profile) => this.session.setProfile(profile)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.session.clear()),
        catchError(() => {
          this.session.clear();
          return of(void 0);
        }),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBaseUrl}/auth/change-password`,
      { currentPassword, newPassword },
      { headers: idempotencyHeader() },
    );
  }

  private applyTokenResponse(response: AuthTokenResponse): void {
    this.session.applyAuthResult(response.accessToken, response.roles, response.mustChangePassword);
  }
}
