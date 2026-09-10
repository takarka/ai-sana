import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

export interface LangLinks {
  isRu: boolean;
  ruHref: string;
  kkHref: string;
}

// pathname всегда начинается с /ru/ или /kk/ — это baseHref сборки, под
// которым отдаётся сама страница (план 04-landing-migration.md, §2).
export function computeLangLinks(pathname: string): LangLinks {
  const isRu = pathname.startsWith('/ru');
  return {
    isRu,
    ruHref: isRu ? pathname : pathname.replace(/^\/kk(\/|$)/, '/ru$1'),
    kkHref: isRu ? pathname.replace(/^\/ru(\/|$)/, '/kk$1') : pathname,
  };
}

// Каждая локаль — отдельный собранный бандл под своим baseHref — общего
// клиентского роутера, который знал бы обе локали сразу, нет. Переключатель
// поэтому не роутит, а строит обычную ссылку на текущий путь под другим
// префиксом; переход — обычная навигация браузера, с полной перезагрузкой
// (см. §2.1 плана).
@Component({
  selector: 'app-lang-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lang-switcher.html',
  styleUrl: './lang-switcher.scss',
})
export class LangSwitcher {
  private readonly document = inject(DOCUMENT);
  protected readonly links = computeLangLinks(
    this.document.location?.pathname || '/ru/'
  );
}
