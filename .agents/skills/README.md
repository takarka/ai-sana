# Скиллы репозитория

Скиллы лежат в `.agents/skills/<имя>/SKILL.md` (открытый формат Agent Skills).
Для Claude Code каталог продублирован симлинком `.claude/skills` → `../.agents/skills`,
поэтому один и тот же набор виден и агентам, читающим `.agents/`, и Claude Code.

| Скилл | Зачем |
| --- | --- |
| `grilling` | Допрос по плану или решению: агент задаёт вопросы по одному, факты выясняет сам, решения оставляет за вами. |
| `grill-with-docs` | То же самое, но по ходу разговора пишутся документы: глоссарий `CONTEXT.md` и ADR. |
| `domain-modeling` | Ведение доменной модели: термины в `CONTEXT.md`, архитектурные решения в `docs/adr/`. Используется скиллом `grill-with-docs`. |
| `design-taste-frontend` | Фронтенд-дизайн лендингов и портфолио без «шаблонного» вида. |

Вызов: `/grilling`, `/grill-with-docs`, `/domain-modeling`.

`grill-with-docs` тянет за собой `domain-modeling` — удалять его отдельно нельзя.

`skills-lock.json` в корне фиксирует источник и хеш только для скиллов, скачанных
из внешних репозиториев (`design-taste-frontend`). Скиллы `grilling`,
`grill-with-docs` и `domain-modeling` лежат в репозитории как есть и в lock-файле
не записаны.
