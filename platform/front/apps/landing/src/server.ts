import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Локаль по умолчанию — ru, редирект на неё уважает Accept-Language: kk
// (план 04-landing-migration.md, шаг 2). Каждая локаль — отдельный собранный
// бандл под своим префиксом (/ru, /kk), сам AngularNodeAppEngine их не выбирает
// за пользователя — сюда попадают только запросы без префикса локали.
const DEFAULT_LOCALE = 'ru';

function resolvePreferredLocale(acceptLanguage: string | undefined): string {
  if (acceptLanguage && /\bkk\b/i.test(acceptLanguage)) {
    return 'kk';
  }
  return DEFAULT_LOCALE;
}

app.get('/', (req, res) => {
  const locale = resolvePreferredLocale(req.headers['accept-language']);
  res.redirect(302, `/${locale}/`);
});

// robots.txt и sitemap.xml обязаны отдаваться с корня домена, а не из-под
// префикса локали (/ru, /kk) — сами файлы копируются из apps/landing/public
// в КАЖДУЮ локальную сборку (assets в project.json настроен на каждый
// outputPath отдельно), содержимое идентично в обеих, поэтому для корневого
// запроса достаточно любой копии (находка 05,
// docs/plan/04-landing-migration-audit.md).
app.get(['/robots.txt', '/sitemap.xml'], (req, res, next) => {
  res.sendFile(join(browserDistFolder, DEFAULT_LOCALE, req.path), (err) => {
    if (err) next(err);
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
