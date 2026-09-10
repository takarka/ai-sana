import { Dialog } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CraftButton } from '@front/ui';
import { filter } from 'rxjs/operators';
import { openDemoModal } from '../demo-modal/demo-modal';
import { LangSwitcher } from '../lang-switcher/lang-switcher';

// Ярлык модуля рядом с лого (перенос .logo__tag из eighth-version —
// там это была статичная подпись в разметке каждой HTML-страницы,
// здесь один SPA-шаблон на все маршруты, поэтому подпись выводится
// по текущему URL). На главной ("/") подписи нет — как и в оригинале
// у index.html не было .logo__tag.
const MODULE_TAGS: Record<string, string> = {
  '/matrix': 'MATRIX',
  '/builder': 'BUILDER',
  '/pisa': 'PISA',
};

function moduleTagFor(url: string): string | null {
  const path = url.split(/[?#]/, 1)[0];
  return MODULE_TAGS[path] ?? null;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CraftButton, LangSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navOpen = signal(false);
  protected readonly moduleTag = signal(moduleTagFor(this.router.url));
  private readonly firstNavLink = viewChild<ElementRef<HTMLElement>>('firstNavLink');
  private readonly burgerBtn = viewChild<ElementRef<HTMLElement>>('burgerBtn');

  // Перенос is-stuck из eighth-version/js/core.js — только нижняя граница
  // (не фон: opacity фиксирована на .90 сознательно, см. комментарий над
  // .head в header.scss — при .76 контраст .nav a не проходил AA). Без
  // границы в самом верху страницы шапка ближе к «стеклу над героем» из
  // оригинала (находка 18, docs/plan/04-landing-migration-audit.md).
  protected readonly isStuck = signal(false);

  constructor() {
    const navigation = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.moduleTag.set(moduleTagFor(event.urlAfterRedirects)));
    this.destroyRef.onDestroy(() => navigation.unsubscribe());

    afterNextRender(() => {
      const onScroll = () => this.isStuck.set(window.scrollY > 30);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  // Ниже 1180px .nav — не инлайн-строка, а fixed-дропдаун (см. header.scss),
  // в закрытом виде скрытый через visibility:hidden (правильно выпадает из
  // tab-order). Но nav стоит в DOM РАНЬШЕ бургера — открыв меню, Tab с
  // бургера продолжал бы вперёд мимо уже видимой навигации прямо в контент
  // страницы (не совпадало бы с тем, что видно на экране — WCAG 2.4.3).
  // Чинится переносом фокуса на первый пункт меню при открытии; дальше
  // естественный DOM-порядок (пункты → переключатель языка → бургер) уже
  // совпадает с видимым.
  protected toggleNav(): void {
    const opening = !this.navOpen();
    this.navOpen.set(opening);
    if (opening) {
      setTimeout(() => this.firstNavLink()?.nativeElement.focus());
    }
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected onNavEscape(): void {
    this.closeNav();
    this.burgerBtn()?.nativeElement.focus();
  }

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}
