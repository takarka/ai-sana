---
status: accepted
date: 2026-09-10
---

# Фронтенд платформы — Nx + Angular + Tailwind CSS v4

Таблица стека в [части 1 ТЗ](../tz/01-tz-platforma.md) рекомендовала
TypeScript + React со сборкой Vite, а [план инициализации](../plan/01-bootstrap-platform.md)
исходил из Nx + Angular по требованию заказчика — документы противоречили друг
другу. Расхождение снято в пользу плана: кабинет строится на **Nx + Angular**,
слой оформления — **Tailwind CSS v4** поверх токенов дизайн-системы. Решение
принято владельцем проекта 10.09.2026.

## Что зафиксировано

| Позиция | Значение |
|---|---|
| Монорепозиторий | Nx, пресет `angular-monorepo`, одно приложение `craft-web` |
| Фреймворк | Angular (последняя стабильная), строгий TypeScript и `strictTemplates` |
| Оформление | Tailwind CSS v4, конфигурация только в CSS (`@theme`) |
| Токены | CSS-переменные с лендинга `eighth-version` в `libs/shared/ui-tokens` |
| Компоненты | Собственные на Angular CDK, без Angular Material и UI-китов поверх Tailwind |
| Тесты | Jest (unit) + Playwright (e2e) |
| SSR | выключен |

## Почему не React + Vite из ТЗ

Angular был требованием заказчика с самого начала, и план строился под него;
React в ТЗ остался как ранняя рекомендация, которую никто не переносил в
проектные решения. Помимо этого: строгая структура Angular и Nx-границы модулей
лучше держат долгоживущую кодовую базу в команде 12–16 человек, а Angular CDK
закрывает доступность (`Overlay`, `FocusTrap`, `LiveAnnouncer`, виртуальный
скролл) без сборки собственных примитивов. Переписывать план под React означало
бы менять и структуру монорепозитория, и подход к дизайн-системе ради строки в
таблице.

## Почему Tailwind рядом с токенами, а не вместо них

Бренд-слой (цвет, типографика, статусы) уже выверен по WCAG AA на лендинге и
остаётся в CSS-переменных — Tailwind получает к ним доступ через `@theme` и
раздаёт утилиты, значения которых берутся из тех же токенов. Переключение темы
модуля (MATRIX / BUILDER / PISA) и плотности (comfortable / compact / junior)
по-прежнему делается переопределением переменных на контейнере маршрута, то есть
одна палитра, а не две. Правила и границы — в
[03-design-system.md, раздел 4.5](../plan/03-design-system.md).

## Сверка с официальными скиллами Angular и Nx

- **Tailwind v4, не v3.** Скилл `angular-developer`
  ([references/tailwind-css.md](../../.agents/skills/angular-developer/references/tailwind-css.md))
  прямо предупреждает: `tailwind.config.js` и директивы `@tailwind base/components/utilities`
  ломают сборку современного Angular. Используем `@import 'tailwindcss'`
  (в SCSS — `@use 'tailwindcss'`) и `@theme`.
- **Кто ставит Tailwind.** В пакете `@nx/angular` генератора `setup-tailwind`
  больше нет (проверено на `nrwl/nx@9e9dbb2`), поэтому подключаем через
  `ng add tailwindcss` или вручную: `tailwindcss`, `@tailwindcss/postcss`,
  `postcss` и `.postcssrc.json`.
- **Ограничение бандла.** `NFR-PRF-07` (300 КБ) не отменяется: Tailwind включает
  в сборку только использованные утилиты, но проверка остаётся в CI.
