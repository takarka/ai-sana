export const environment = {
  production: false,
  // /backend — не префикс бэкенда (у него его нет, см. Program.cs), а
  // технический префикс только для dev-прокси: без него пути API (/auth/login,
  // /platform/orgs) совпадают с собственными маршрутами SPA того же кабинета
  // (app.routes.ts), и прокси в proxy.conf.json перехватывал бы прямые
  // переходы/обновление страницы на /auth/login или /platform/** раньше,
  // чем сработает SPA-фолбэк на index.html. pathRewrite в proxy.conf.json
  // снимает этот префикс перед проксированием на CraftAi.Api.
  apiUrl: '/backend',
};
