# Скиллы и MCP репозитория

Скиллы лежат в `.agents/skills/<имя>/SKILL.md` (открытый формат Agent Skills).
Для Claude Code каталог продублирован симлинком `.claude/skills` → `../.agents/skills`,
поэтому один и тот же набор виден и агентам, читающим `.agents/`, и Claude Code.

| Скилл | Зачем |
| --- | --- |
| `angular-developer` | Официальный скилл Angular: генерация кода и архитектурные подсказки по сигналам, формам, DI, роутингу, SSR, доступности, тестам и CLI. 40 файлов в `references/` подгружаются по мере надобности. |
| `angular-new-app` | Официальный скилл Angular: создание нового приложения через Angular CLI (`ng new`) с современными настройками. |
| `nx-workspace` | Nx: разбор монорепозитория — проекты, таргеты, граф зависимостей, разбор падений `nx`-команд. |
| `nx-generate` | Nx: генерация кода через генераторы Nx по конвенциям рабочей области. |
| `nx-run-tasks` | Nx: запуск и кэширование задач (`nx run`, `run-many`, `affected`). |
| `nx-import` | Nx: перенос существующего проекта в монорепозиторий (`nx import`). |
| `nx-plugins` | Nx: работа с плагинами и их конфигурацией. |
| `link-workspace-packages` | Nx: связывание пакетов внутри рабочей области. |
| `monitor-ci` | Nx: слежение за CI в Nx Cloud, разбор падений и починка до зелёного. Требует Nx Cloud. |
| `grilling` | Допрос по плану или решению: агент задаёт вопросы по одному, факты выясняет сам, решения оставляет за вами. |
| `grill-with-docs` | То же самое, но по ходу разговора пишутся документы: глоссарий `CONTEXT.md` и ADR. |
| `domain-modeling` | Ведение доменной модели: термины в `CONTEXT.md`, архитектурные решения в `docs/adr/`. Используется скиллом `grill-with-docs`. |
| `design-taste-frontend` | Фронтенд-дизайн лендингов и портфолио без «шаблонного» вида. |

Скиллы вызываются по имени: `/angular-developer`, `/nx-workspace`, `/grilling` и так далее.

`grill-with-docs` тянет за собой `domain-modeling` — удалять его отдельно нельзя.

## Установка и обновление

Скиллы из внешних репозиториев ставятся утилитой [skills.sh](https://skills.sh/),
она же пишет источник и хеш в корневой `skills-lock.json`:

```bash
npx skills add https://github.com/angular/skills   # angular-developer, angular-new-app
npx skills add nrwl/nx-ai-agents-config             # семь nx-* скиллов
```

Скиллы `grilling`, `grill-with-docs` и `domain-modeling` лежат в репозитории как
есть (перенесены из личных скиллов) и в `skills-lock.json` не записаны.

## MCP-серверы

В корне лежит `.mcp.json` с двумя серверами: `angular-cli` (встроен в Angular CLI)
и `nx-mcp` (Nx). Claude Code подхватывает этот файл автоматически при работе
в этом репозитории и спрашивает подтверждение при первом запуске. Для других
клиентов те же блоки кладутся в `.vscode/mcp.json`, `.cursor/mcp.json`,
`.gemini/settings.json` или `.antigravity/mcp.json` — подробности в
[references/mcp.md](angular-developer/references/mcp.md).

### Angular CLI MCP

Команда: `npx -y @angular/cli mcp`. Что даёт: `get_best_practices` (актуальные правила под версию Angular в проекте),
`search_documentation` и `find_examples` (поиск по angular.dev), `list_projects`
(чтение `angular.json`), `onpush_zoneless_migration`, `ai_tutor`. Инструменты
`devserver.*` и `run_target` появляются только когда в рабочем каталоге есть
Angular workspace — то есть после создания `platform/front`.

Полезные флаги `@angular/cli mcp`: `--read-only` (только инструменты, не меняющие проект),
`--local-only` (без обращений в интернет).

### Nx MCP

`nx-mcp` даёт агенту граф проектов, список генераторов, документацию Nx
(`nx_docs`) и связь с Nx Cloud (self-healing CI, мониторинг задач). Пока в
репозитории нет Nx workspace, регистрируется только `nx_docs` — остальные
инструменты появятся, когда будет создан `platform/front` с `nx.json`.

Тогда же имеет смысл:

* переключить конфиг на `npx nx mcp` (для Nx >= 21.4 это тот же сервер, но из
  локальной установки) и/или указать путь к рабочей области:
  `["-y", "nx-mcp@latest", "platform/front"]`;
* прогнать `npx nx configure-ai-agents` внутри рабочей области — команда
  дописывает правила агентов (`AGENTS.md`, `CLAUDE.md`), конфиг MCP и те же
  nx-скиллы, а затем проверить результат через
  `npx nx configure-ai-agents --check=all`.

Полезные флаги `nx-mcp`: `--no-minimal` (показать все инструменты анализа
рабочей области), `--tools` (фильтр по именам), `--disableTelemetry` (уже стоит
в конфиге).
