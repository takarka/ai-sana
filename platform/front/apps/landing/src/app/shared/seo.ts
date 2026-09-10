import { DOCUMENT } from '@angular/common';
import { LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  /** Путь маршрута без языкового префикса и без слэшей, напр. 'matrix'. Пустая строка — главная. */
  path: string;
}

/**
 * Title/description/hreflang/canonical на каждый маршрут — перенос
 * <title> и <meta name="description"> из eighth-version/*.html (там страница
 * — отдельный HTML-файл, у каждого свой заголовок) в SPA, где страница —
 * один компонент на маршрут (находка 05, docs/plan/04-landing-migration-audit.md).
 *
 * До этого все четыре маршрута отдавали статичный <title>landing</title> из
 * apps/landing/src/index.html и общий hreflang на корень локали
 * (/ru/, /kk/) независимо от страницы.
 *
 * Тег canonical/hreflang — не через Meta (тот умеет только <meta>, не
 * <link rel=alternate|canonical>): ищем существующий тег по атрибуту и
 * переиспользуем, создаём только если его ещё нет — так следующий вызов
 * (переход на другой маршрут в той же SPA-сессии) просто перезаписывает
 * href того же элемента, а не плодит дубликаты в <head>.
 */
export function setSeo(data: SeoData): void {
  const document = inject(DOCUMENT);
  const titleService = inject(Title);
  const meta = inject(Meta);
  const locale = inject(LOCALE_ID);

  titleService.setTitle(data.title);
  meta.updateTag({ name: 'description', content: data.description });

  const suffix = data.path ? `${data.path}/` : '';
  const alternates: Array<[string, string]> = [
    ['ru', `/ru/${suffix}`],
    ['kk', `/kk/${suffix}`],
    ['x-default', `/ru/${suffix}`],
  ];
  for (const [hreflang, href] of alternates) {
    upsertLink(document, `link[rel="alternate"][hreflang="${hreflang}"]`, {
      rel: 'alternate',
      hreflang,
      href,
    });
  }

  const localePrefix = locale.startsWith('kk') ? 'kk' : 'ru';
  upsertLink(document, 'link[rel="canonical"]', {
    rel: 'canonical',
    href: `/${localePrefix}/${suffix}`,
  });
}

function upsertLink(document: Document, selector: string, attrs: Record<string, string>): void {
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    document.head.appendChild(link);
  }
  for (const [name, value] of Object.entries(attrs)) {
    link.setAttribute(name, value);
  }
}
