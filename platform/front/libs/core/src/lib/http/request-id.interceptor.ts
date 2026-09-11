import { HttpInterceptorFn } from '@angular/common/http';

// X-Request-Id (API-03) — сквозной идентификатор запроса для логов и
// сообщений об ошибках; сервер эхом возвращает его же, если передан.
export const requestIdInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Request-Id': crypto.randomUUID() } }));
