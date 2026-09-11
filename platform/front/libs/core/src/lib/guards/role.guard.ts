import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../session/session.store';

// Матрица плана 08 §2, дословно: маршрут закрыт политикой, а не только
// скрытием пункта меню (план 09 §5, комментарий к таблице контракта).
export function roleGuard(allowedRoles: readonly string[]): CanActivateFn {
  return () => {
    const session = inject(SessionStore);
    const router = inject(Router);

    return session.hasAnyRole(allowedRoles) ? true : router.createUrlTree(['/platform/403']);
  };
}
