import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// Локализованная prod-сборка обязательна: маршрутизация по локалям
// (/ru/, /kk/) — это subPath каждого собранного бандла (angular.json i18n),
// а не что-то, что умеет обслуживать CSR dev-server. Поэтому e2e поднимает
// не `landing:serve`, а реальный SSR-сервер поверх `--localize`-сборки —
// тот же способ, каким проверялись страницы вручную в шагах 3–4 плана
// 04-landing-migration.md. NG_ALLOWED_HOSTS обязателен для @angular/ssr
// (см. server.ts) — без него сервер отвечает 400 на любой Host.
const PORT = 4310;
const baseURL = process.env['BASE_URL'] || `http://localhost:${PORT}`;

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx nx run landing:build:production --localize && NG_ALLOWED_HOSTS=localhost PORT=${PORT} node dist/apps/landing/server/server.mjs`,
    url: `${baseURL}/ru/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    cwd: workspaceRoot,
  },
  // Только Chromium: это единственный браузер, предустановленный в текущем
  // окружении (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers), а `playwright
  // install` здесь запускать нельзя (нет сети на скачивание firefox/webkit).
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
      },
    },
  ],
});
