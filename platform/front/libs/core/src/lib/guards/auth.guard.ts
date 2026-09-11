import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session/session.store';

// Сессия к этому моменту уже восстановлена (или нет) — APP_INITIALIZER в
// apps/admin дожидается hydrateFromRefreshCookie$() до первой навигации
// роутера (план 09 §4.2, F1.6).
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
