import { DOCUMENT } from '@angular/common';
import { LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  /** Путь маршрута без языкового префикса и без слэшей, напр. 'matrix'. Пустая строка — главная. */
  path: string;
  /** Абсолютный URL картинки для og:image/twitter:image. По умолчанию — общий обложечный кадр сайта. */
  image?: string;
}

// Продовый домен (см. scripts/update-frontend.sh, health-check на
// craftai.kz). canonical/hreflang обязаны быть абсолютными: относительные
// href для hreflang Google не принимает (требует fully-qualified URL,
// https://developers.google.com/search/docs/specialty/international/localized-versions),
// поэтому раньше мультиязычная разметка фактически не работала.
const SITE_ORIGIN = 'https://craftai.kz';
const SITE_NAME = 'CRAFT AI';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/img/og-cover.png`;

/**
 * Title/description/hreflang/canonical/OG/Twitter/JSON-LD на каждый маршрут —
 * перенос <title> и <meta name="description"> из eighth-version/*.html (там
 * страница — отдельный HTML-файл, у каждого свой заголовок) в SPA, где
 * страница — один компонент на маршрут (находка 05,
 * docs/plan/04-landing-migration-audit.md).
 *
 * До этого все четыре маршрута отдавали статичный <title>landing</title> из
 * apps/landing/src/index.html и общий hreflang на корень локали
 * (/ru/, /kk/) независимо от страницы, а Open Graph/Twitter/структурированные
 * данные не выставлялись вовсе.
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
  const localePrefix = locale.startsWith('kk') ? 'kk' : 'ru';
  const canonicalUrl = `${SITE_ORIGIN}/${localePrefix}/${suffix}`;
  const image = data.image ?? DEFAULT_IMAGE;

  const alternates: Array<[string, string]> = [
    ['ru', `${SITE_ORIGIN}/ru/${suffix}`],
    ['kk', `${SITE_ORIGIN}/kk/${suffix}`],
    ['x-default', `${SITE_ORIGIN}/ru/${suffix}`],
  ];
  for (const [hreflang, href] of alternates) {
    upsertLink(document, `link[rel="alternate"][hreflang="${hreflang}"]`, {
      rel: 'alternate',
      hreflang,
      href,
    });
  }

  upsertLink(document, 'link[rel="canonical"]', {
    rel: 'canonical',
    href: canonicalUrl,
  });

  const ogLocale = localePrefix === 'kk' ? 'kk_KZ' : 'ru_RU';
  const openGraphTags: Array<[string, string]> = [
    ['og:type', 'website'],
    ['og:site_name', SITE_NAME],
    ['og:locale', ogLocale],
    ['og:title', data.title],
    ['og:description', data.description],
    ['og:url', canonicalUrl],
    ['og:image', image],
  ];
  for (const [property, content] of openGraphTags) {
    meta.updateTag({ property, content });
  }

  const twitterTags: Array<[string, string]> = [
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', data.title],
    ['twitter:description', data.description],
    ['twitter:image', image],
  ];
  for (const [name, content] of twitterTags) {
    meta.updateTag({ name, content });
  }

  upsertJsonLd(document, buildStructuredData(localePrefix));
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

const JSON_LD_ID = 'structured-data-org';

function upsertJsonLd(document: Document, data: unknown): void {
  let script = document.head.querySelector<HTMLScriptElement>(
    `script[type="application/ld+json"]#${JSON_LD_ID}`
  );
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Organization + WebSite в одном @graph — сайт-уровневые данные, не зависят
 * от конкретной страницы, только от локали (url на локализованную главную).
 * Дублировать на каждый маршрут не нужно: Google сопоставляет @id внутри
 * одного документа, а сам элемент лежит в <head>, общем для SPA-сессии.
 */
function buildStructuredData(localePrefix: 'ru' | 'kk'): unknown {
  const homeUrl = `${SITE_ORIGIN}/${localePrefix}/`;
  const orgId = `${SITE_ORIGIN}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: SITE_NAME,
        url: homeUrl,
        logo: `${SITE_ORIGIN}/favicon.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: SITE_NAME,
        url: homeUrl,
        publisher: { '@id': orgId },
      },
    ],
  };
}
