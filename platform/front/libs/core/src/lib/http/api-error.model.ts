import { HttpErrorResponse } from '@angular/common/http';

// Единый формат ошибки API (API-04) — зеркало CraftAi.SharedKernel.Http.Errors.ApiError.
export interface ApiError {
  readonly code: string;
  readonly type: string;
  readonly message: string;
  readonly requestId: string;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'type' in value &&
    'message' in value &&
    'requestId' in value
  );
}

// Код ошибки для словаря i18n (errors.<code>, план 09; ADR-0004: бэкенд не
// хранит локализацию, только код) — network/generic для ответов без тела ApiError.
export function errorTranslationKey(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (isApiError(error.error)) {
      return `errors.${error.error.code}`;
    }
    if (error.status === 0) {
      return 'errors.network';
    }
  }
  return 'errors.generic';
}
