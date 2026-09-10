import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CraftButton } from '@front/ui';
import { openDemoModal } from '../demo-modal/demo-modal';
import { LangSwitcher } from '../lang-switcher/lang-switcher';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CraftButton, LangSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly dialog = inject(Dialog);

  protected readonly navOpen = signal(false);
  private readonly firstNavLink = viewChild<ElementRef<HTMLElement>>('firstNavLink');
  private readonly burgerBtn = viewChild<ElementRef<HTMLElement>>('burgerBtn');

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
