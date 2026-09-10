# Архитектурные решения (ADR)

Каждый файл фиксирует одно решение: контекст, выбор и почему отвергнуты
альтернативы. Формат — [ADR-FORMAT.md](../../.agents/skills/domain-modeling/ADR-FORMAT.md).
Нумерация сквозная, файлы не переписываются: устаревшее решение получает статус
`superseded by ADR-NNNN`, а не правку задним числом.

| № | Решение | Статус |
|---|---|---|
| [0001](0001-backend-stack-dotnet.md) | Бэкенд — .NET 10 (ASP.NET Core), модульный монолит. Закрывает Q-7 | accepted |
| [0002](0002-frontend-stack-angular-tailwind.md) | Фронтенд — Nx + Angular + Tailwind CSS v4 | accepted |
| [0003](0003-landing-eighth-version-to-angular.md) | Публичный сайт — `apps/landing` (Angular, SSR) вместо статического `eighth-version/`; все версии лендинга в root удаляются после cutover. Закрывает открытый вопрос L-1 | accepted |
