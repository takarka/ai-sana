import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { openDemoModal } from '../demo-modal/demo-modal';
import { LangSwitcher } from '../lang-switcher/lang-switcher';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LangSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private readonly dialog = inject(Dialog);

  protected openDemo(): void {
    openDemoModal(this.dialog);
  }
}
