import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}
