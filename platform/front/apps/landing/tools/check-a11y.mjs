// Автоматическая проверка axe (A/AA) для всех страниц лендинга на обеих
// локалях, включая открытую модалку демо (план 04-landing-migration.md,
// §4, шаг 4). В отличие от libs/shared/ui/tools/check-a11y.mjs (там
// статический Storybook), здесь нужен реальный SSR-сервер — маршруты и
// baseHref завязаны на @angular/ssr (см. NG_ALLOWED_HOSTS в server.ts).
//
// Запуск: nx run landing:build:production --localize
//         node apps/landing/tools/check-a11y.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../..');
const serverEntry = path.join(workspaceRoot, 'dist/apps/landing/server/server.mjs');
const axeSource = readFileSync(
  path.join(workspaceRoot, 'node_modules/axe-core/axe.min.js'),
  'utf8'
);

const PORT = 4310;
const baseUrl = `http://localhost:${PORT}`;

const server = spawn('node', [serverEntry], {
  env: { ...process.env, PORT: String(PORT), NG_ALLOWED_HOSTS: 'localhost' },
  stdio: ['ignore', 'pipe', 'inherit'],
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('landing SSR server did not start in time')), 20_000);
  server.stdout.on('data', (chunk) => {
    if (chunk.toString().includes('listening')) {
      clearTimeout(timeout);
      resolve();
    }
  });
  server.on('exit', (code) => reject(new Error(`landing SSR server exited early (code ${code})`)));
});

const pages = ['', 'matrix', 'builder', 'pisa'].flatMap((slug) => [
  { locale: 'ru', url: `${baseUrl}/ru/${slug}`, openModal: false },
  { locale: 'kk', url: `${baseUrl}/kk/${slug}`, openModal: false },
]);
// Модалка демо — одна и та же на всех страницах (app/shared/demo-modal),
// достаточно проверить её один раз поверх главной страницы каждой локали.
pages.push(
  { locale: 'ru', url: `${baseUrl}/ru/`, openModal: true },
  { locale: 'kk', url: `${baseUrl}/kk/`, openModal: true }
);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let failures = 0;
for (const target of pages) {
  await page.goto(target.url, { waitUntil: 'networkidle' });
  let label = target.url.replace(baseUrl, '');
  if (target.openModal) {
    await page.locator('.header-cta').click();
    await page.locator('.demo-modal').waitFor({ state: 'visible' });
    label += ' (demo modal open)';
  }
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(
    async () =>
      await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
  );
  if (results.violations.length > 0) {
    failures += results.violations.length;
    console.error(`\n✘ ${label}`);
    for (const violation of results.violations) {
      console.error(`  [${violation.impact}] ${violation.id}: ${violation.help}`);
      for (const node of violation.nodes) {
        console.error(`    ${node.target.join(' ')} :: ${node.failureSummary}`);
      }
    }
  } else {
    console.log(`✔ ${label}`);
  }
}

await browser.close();
server.kill();
process.exit(failures > 0 ? 1 : 0);
