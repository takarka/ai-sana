import { Route } from '@angular/router';
import { PLATFORM_ROLES, authGuard, roleGuard } from '@front/core';

// apps/* — только конфиг и роутинг (platform/front/CLAUDE.md): маршруты
// ссылаются на компоненты из libs/features/**, само приложение их не содержит.
export const appRoutes: Route[] = [
  {
    path: 'auth/login',
    loadComponent: () => import('@front/features/auth').then((m) => m.LoginPage),
  },
  {
    path: 'auth/change-password',
    canActivate: [authGuard],
    loadComponent: () => import('@front/features/auth').then((m) => m.ChangePasswordPage),
  },
  {
    path: 'platform',
    canActivate: [authGuard],
    loadComponent: () => import('@front/features/shell').then((m) => m.ShellLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('@front/features/shell').then((m) => m.OverviewPage),
      },
      {
        path: 'orgs',
        canActivate: [roleGuard([PLATFORM_ROLES.SuperAdmin])],
        loadComponent: () => import('@front/features/organizations').then((m) => m.OrganizationsListPage),
      },
      {
        path: 'orgs/:orgId',
        canActivate: [roleGuard([PLATFORM_ROLES.SuperAdmin])],
        loadComponent: () => import('@front/features/organizations').then((m) => m.OrganizationDetailPage),
      },
      {
        path: 'authors',
        canActivate: [roleGuard([PLATFORM_ROLES.SuperAdmin])],
        loadComponent: () => import('@front/features/authors').then((m) => m.AuthorsListPage),
      },
      {
        path: 'content/matrix',
        canActivate: [roleGuard([PLATFORM_ROLES.SuperAdmin, PLATFORM_ROLES.Author])],
        loadComponent: () => import('@front/features/matrix').then((m) => m.MatrixContentPage),
      },
      {
        path: 'content/pisa',
        canActivate: [roleGuard([PLATFORM_ROLES.SuperAdmin, PLATFORM_ROLES.Author])],
        loadComponent: () => import('@front/features/shell').then((m) => m.ComingSoonPage),
        data: { titleKey: 'shell.nav.pisa' },
      },
      {
        path: '403',
        loadComponent: () => import('@front/features/shell').then((m) => m.ForbiddenPage),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'platform' },
  {
    path: '404',
    loadComponent: () => import('@front/features/shell').then((m) => m.NotFoundPage),
  },
  { path: '**', redirectTo: '404' },
];
