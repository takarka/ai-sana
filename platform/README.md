# platform

Frontend (`front/`, Nx + Angular) и backend (`back/`, .NET 10) школьной платформы CRAFT AI.
Подробности — [docs/plan/01-bootstrap-platform.md](../docs/plan/01-bootstrap-platform.md), решения по стеку — [docs/adr](../docs/adr/README.md).

## Поднять локально

```bash
# Инфраструктура: PostgreSQL 16 + Redis 7
docker compose up -d

# Backend: API + MigrationService поднимаются вместе через Aspire AppHost
cd back && dotnet run --project src/Bootstrap/CraftAi.AppHost

# Frontend: admin (4201) и learn (4202) — из отдельного терминала
cd front && npx nx run-many -t serve -p admin learn
```

`docker compose down -v` — остановить инфраструктуру и снести volumes.

## E2E-тесты admin (Playwright)

```bash
# Полный стек (docker compose + AppHost) уже поднят — см. выше.
export E2E_ADMIN_EMAIL=...      # тот же Identity__SuperAdmin__Email, что задавали AppHost
export E2E_ADMIN_PASSWORD=...   # тот же Identity__SuperAdmin__InitialPassword

cd front && npx nx e2e admin-e2e
```

`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` — учётные данные первого суперадмина
(план 09 §7 О5): один и тот же пароль подходит и до, и после обязательной
смены при первом входе — `setup`-проект Playwright сам проходит экран смены
пароля на чистой БД (`ChangePasswordHandler` не запрещает совпадение нового
пароля с текущим).
