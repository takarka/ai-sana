import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { SessionStore } from '../session/session.store';
import { API_BASE_URL } from './api-base-url.token';

// /auth/login и /auth/refresh — анонимные: не несут Authorization и не должны
// сами запускать повторный refresh при 401 (иначе бесконечная рекурсия).
function isAnonymousAuthCall(url: string, apiBaseUrl: string): boolean {
  return url === `${apiBaseUrl}/auth/login` || url === `${apiBaseUrl}/auth/refresh`;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const authApi = inject(AuthApi);
  const router = inject(Router);
  const apiBaseUrl = inject(API_BASE_URL);

  if (!req.url.startsWith(apiBaseUrl) || isAnonymousAuthCall(req.url, apiBaseUrl)) {
    return next(req);
  }

  const accessToken = session.getAccessToken();
  const authorizedReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return retryAfterRefresh(authorizedReq, next, authApi, router, error);
      }
      return throwError(() => error);
    }),
  );
};

function retryAfterRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authApi: AuthApi,
  router: Router,
  originalError: HttpErrorResponse,
): Observable<HttpEvent<unknown>> {
  return authApi.refreshOnce$().pipe(
    switchMap((refreshed) =>
      next(req.clone({ setHeaders: { Authorization: `Bearer ${refreshed.accessToken}` } })),
    ),
    catchError(() => {
      void router.navigateByUrl('/auth/login');
      return throwError(() => originalError);
    }),
  );
}
