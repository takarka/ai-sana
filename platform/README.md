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
