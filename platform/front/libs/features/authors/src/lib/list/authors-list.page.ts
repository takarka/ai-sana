import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthorAccountSummary, AuthorsApi, TranslatePipe } from '@front/core';
import { CraftButton, CraftEmptyState, openCredentialsRevealDialog } from '@front/ui';
import { openCreateAuthorAccountDialog } from '../dialogs/create-author-account/create-author-account.dialog';

// «Методисты платформы» — управление учётными записями роли `author`
// (план 08 §2). Доступно только superadmin (та же политика platform.admin,
// что и /platform/orgs), сам методист эту страницу не видит.
@Component({
  selector: 'app-authors-list-page',
  imports: [DialogModule, DatePipe, CraftButton, CraftEmptyState, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './authors-list.page.html',
  styleUrl: './authors-list.page.scss',
})
export class AuthorsListPage {
  private readonly authorsApi = inject(AuthorsApi);
  private readonly dialog = inject(Dialog);

  protected readonly loading = signal(true);
  protected readonly items = signal<readonly AuthorAccountSummary[]>([]);

  constructor() {
    this.fetch();
  }

  protected createAuthor(): void {
    openCreateAuthorAccountDialog(this.dialog).closed.subscribe((created) => {
      if (!created) return;
      this.fetch();
      openCredentialsRevealDialog(this.dialog, {
        login: created.login,
        password: created.generatedPassword,
      });
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.authorsApi.listAuthorAccounts().subscribe((items) => {
      this.items.set(items);
      this.loading.set(false);
    });
  }
}
