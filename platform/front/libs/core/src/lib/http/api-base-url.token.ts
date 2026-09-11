import { InjectionToken } from '@angular/core';

// Базовый URL API без хвостового слэша — все вызовы в api/*.api.ts сами
// добавляют путь вида `/auth/login`, `/platform/orgs` (бэкенд не использует
// префикс /api, см. Program.cs — единственное исключение, /api/v1/ping, кабинету не нужно).
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
