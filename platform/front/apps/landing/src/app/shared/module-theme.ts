import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';

/**
 * Включает модульный акцент страницы (--m-matrix/--m-builder/--m-pisa,
 * см. libs/shared/ui-tokens/src/theme.css) — перенос
 * body.page--matrix/--builder/--pisa из eighth-version/styles.css.
 *
 * Атрибут ставится на <body>, а не на хост компонента страницы: акцент
 * обязан быть виден и в шапке/футере (app-header/app-footer — соседи
 * маршрута, а не его потомки), и в WebGL-сцене (shared/scene/scene.ts читает
 * getComputedStyle(document.body) один раз при загрузке) — оба вне поддерева
 * страницы, куда CSS-переменные с хоста компонента не докатились бы.
 *
 * Снимается через DestroyRef при уходе со страницы: это SPA, и без сброса
 * акцент "утекает" на соседний маршрут — в eighth-version такой утечки не
 * было, там каждая страница была отдельной загрузкой документа.
 */
export function useModuleTheme(module: 'matrix' | 'builder' | 'pisa'): void {
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);

  document.body.setAttribute('data-module', module);
  destroyRef.onDestroy(() => document.body.removeAttribute('data-module'));
}
