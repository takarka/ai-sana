import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_BASE_URL, AuthApi, authInterceptor, requestIdInterceptor } from '@front/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([requestIdInterceptor, authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    // Access-токен живёт только в памяти (план 09 §4.2, F1.3) — перезагрузка
    // страницы теряет его, поэтому до первой навигации роутера пробуем молча
    // восстановить сессию из httpOnly refresh-cookie.
    provideAppInitializer(() => {
      const authApi = inject(AuthApi);
      return firstValueFrom(authApi.hydrateFromRefreshCookie$());
    }),
  ],
};
