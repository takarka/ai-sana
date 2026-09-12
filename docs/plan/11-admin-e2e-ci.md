# CI для admin-e2e (Playwright): что нужно сделать

**Задача.** `apps/admin-e2e` уже содержит рабочие Playwright-сценарии для
MATRIX и PISA ([PR #16](https://github.com/takarka/ai-sana/pull/16)), но они
ни разу не запускались: агент, который их писал, работал в песочнице без
.NET SDK и без Docker-демона, поэтому проверил только `nx lint` и
`tsc --noEmit`. Этот документ фиксирует, что нужно сделать, чтобы прогнать
`npx nx e2e admin-e2e` по-настоящему и не полагаться на непроверенный код.

**Почему не в песочнице агента.** `admin-e2e` нужен весь стек: PostgreSQL +
Redis (`docker compose`) и backend (`dotnet run`), а не только фронтенд.
Песочница агента не даёт ни того, ни другого (сеть режет установщик .NET,
Docker-демона нет вообще — по всей видимости, ограничение самой песочницы, а
не сети). Зато `backend-ci.yml` уже показал, что на **GitHub-hosted раннере**
Docker есть и Testcontainers-тесты там реально проходят — тот же раннер
годится и для e2e.

## Чек-лист

- [ ] **Секреты репозитория** (Settings → Secrets and variables → Actions):
      `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` — учётные данные первого
      суперадмина, которые пойдут и в backend (`Identity__SuperAdmin__Email`/
      `InitialPassword`), и в Playwright (`auth.setup.ts` читает их же).
      Задача плана 09 §7 О5 «откуда берётся первый суперадмин» здесь
      получает конкретное значение для CI-окружения.

- [ ] **Разобраться с портом/схемой backend↔proxy, ПЕРЕД тем как писать workflow:**
      `apps/admin/proxy.conf.json` проксирует `/backend` на
      `https://localhost:5001`, а `CraftAi.Api/Properties/launchSettings.json`
      слушает `https://localhost:7274;http://localhost:5009` — порты не
      совпадают. Похоже, `5001` был актуален только пока порт задавал Aspire
      AppHost (README: «API + MigrationService поднимаются вместе через
      Aspire AppHost»), а в CI backend, скорее всего, придётся поднимать
      напрямую (`dotnet run --project CraftAi.Api`, без Aspire — так уже
      делает шаг «Publish OpenAPI contract» в `backend-ci.yml`, где API
      поднят на `--urls http://127.0.0.1:5266`). Нужно решить: либо
      подружить `--urls` в CI с портом/схемой из `proxy.conf.json`, либо
      завести отдельный `proxy.conf.ci.json` под явный порт CI и переключать
      его в новом `serve` configuration/окружении для e2e.

- [ ] **Новый workflow `.github/workflows/admin-e2e.yml`** (по образцу
      `backend-ci.yml`, `workflow_dispatch`, чтобы не тратить минуты CI на
      каждый push, пока не устоится):
  1. `actions/checkout@v4`.
  2. Поднять инфраструктуру: `docker compose -f platform/docker-compose.yml up -d`
     (Postgres 16 + Redis — раннер `ubuntu-latest` уже с Docker).
  3. `actions/setup-dotnet@v4` (10.0.x, как в `backend-ci.yml`).
  4. Применить миграции и посев (первый суперадмин): `dotnet run --project
     platform/back/src/Bootstrap/CraftAi.MigrationService`, передав
     `ConnectionStrings__craftai`, `ConnectionStrings__cache`,
     `Jwt__SigningKey`, `Identity__SuperAdmin__Email`,
     `Identity__SuperAdmin__InitialPassword` (из секретов) через env —
     `SeedAsync` идемпотентен, повторные прогоны на той же БД не создают
     второго суперадмина (см. `IdentitySeeder`).
  5. Поднять API в фоне: `dotnet run --project platform/back/src/Bootstrap/CraftAi.Api
     --no-build --configuration Release --urls ...` с теми же
     `ConnectionStrings`/`Jwt__SigningKey`, дождаться `/alive` (как уже
     сделано в `backend-ci.yml`).
  6. `actions/setup-node@v4` + `npm ci` в `platform/front`.
  7. `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` из секретов → env.
  8. `npx nx e2e admin-e2e` (сам поднимет `nx serve admin` через
     `webServer` в `playwright.config.ts`).
  9. `actions/upload-artifact@v4` — Playwright HTML-отчёт и трейсы
     (`dist/.playwright/apps/admin-e2e` или что укажет `nxE2EPreset`) — чтобы
     разбирать первый красный прогон не вслепую.
  10. Остановить контейнеры/процессы в `if: always()`.

- [ ] **Первый прогон — ожидаемо красный.** Сценарии писались без единого
      реального запуска: наверняка найдётся хотя бы один неверный
      `getByLabel`/`getByPlaceholder`/`getByRole` или неучтённый тайминг.
      Смотреть `playwright-report` из артефакта, поправлять точечно —
      структура сценариев (`test.step`) уже разбивает путь на стадии.

- [ ] **После первого зелёного прогона** — решить, переводить ли
      `admin-e2e.yml` с `workflow_dispatch` на `pull_request`/`push`
      (сейчас `backend-ci.yml` тоже только ручной — вероятно, стоит сделать
      это для обоих сразу одним отдельным решением, не в рамках этой задачи).

## Где смотреть

- Сценарии: `platform/front/apps/admin-e2e/src/matrix-content.spec.ts`,
  `pisa-content.spec.ts`, `support/auth.setup.ts`.
- Конфиг Playwright: `platform/front/apps/admin-e2e/playwright.config.ts`.
- Как поднимается backend вручную: `platform/README.md` (`docker compose up`
  → `dotnet run --project src/Bootstrap/CraftAi.AppHost`).
- Прецедент «API+Testcontainers на GitHub-hosted раннере работает»:
  `.github/workflows/backend-ci.yml`.
- Первый суперадмин и его конфигурация: `SuperAdminSeedOptions.cs`,
  `IdentitySeeder.cs` (план 09 §7, О5).
