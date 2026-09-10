# Скиллы и MCP репозитория

Скиллы лежат в `.agents/skills/<имя>/SKILL.md` (открытый формат Agent Skills).
Для Claude Code каталог продублирован симлинком `.claude/skills` → `../.agents/skills`,
поэтому один и тот же набор виден и агентам, читающим `.agents/`, и Claude Code.

| Скилл | Зачем |
| --- | --- |
| `angular-developer` | Официальный скилл Angular: генерация кода и архитектурные подсказки по сигналам, формам, DI, роутингу, SSR, доступности, тестам и CLI. 40 файлов в `references/` подгружаются по мере надобности. |
| `angular-new-app` | Официальный скилл Angular: создание нового приложения через Angular CLI (`ng new`) с современными настройками. |
| `grilling` | Допрос по плану или решению: агент задаёт вопросы по одному, факты выясняет сам, решения оставляет за вами. |
| `grill-with-docs` | То же самое, но по ходу разговора пишутся документы: глоссарий `CONTEXT.md` и ADR. |
| `domain-modeling` | Ведение доменной модели: термины в `CONTEXT.md`, архитектурные решения в `docs/adr/`. Используется скиллом `grill-with-docs`. |
| `design-taste-frontend` | Фронтенд-дизайн лендингов и портфолио без «шаблонного» вида. |

Вызов: `/angular-developer`, `/angular-new-app`, `/grilling`, `/grill-with-docs`,
`/domain-modeling`.

`grill-with-docs` тянет за собой `domain-modeling` — удалять его отдельно нельзя.

## Установка и обновление

Скиллы из внешних репозиториев ставятся утилитой [skills.sh](https://skills.sh/),
она же пишет источник и хеш в корневой `skills-lock.json`:

```bash
npx skills add https://github.com/angular/skills   # angular-developer, angular-new-app
```

Скиллы `grilling`, `grill-with-docs` и `domain-modeling` лежат в репозитории как
есть (перенесены из личных скиллов) и в `skills-lock.json` не записаны.

## MCP-сервер Angular CLI

В корне лежит `.mcp.json` — конфигурация MCP-сервера, встроенного в Angular CLI
(`npx -y @angular/cli mcp`). Claude Code подхватывает её автоматически при работе
в этом репозитории и спрашивает подтверждение при первом запуске. Для других
клиентов тот же блок кладётся в `.vscode/mcp.json`, `.cursor/mcp.json`,
`.gemini/settings.json` или `.antigravity/mcp.json` — подробности в
[references/mcp.md](angular-developer/references/mcp.md).

Что даёт: `get_best_practices` (актуальные правила под версию Angular в проекте),
`search_documentation` и `find_examples` (поиск по angular.dev), `list_projects`
(чтение `angular.json`), `onpush_zoneless_migration`, `ai_tutor`. Инструменты
`devserver.*` и `run_target` появляются только когда в рабочем каталоге есть
Angular workspace — то есть после создания `platform/front`.

Полезные флаги в `args`: `--read-only` (только инструменты, не меняющие проект),
`--local-only` (без обращений в интернет).
