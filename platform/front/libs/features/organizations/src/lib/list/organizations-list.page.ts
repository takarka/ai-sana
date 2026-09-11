import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ListOrganizationsResponse, OrganizationsApi, TranslatePipe } from '@front/core';
import { CraftButton, CraftEmptyState, CraftInput, CraftPagination } from '@front/ui';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { openCreateOrganizationDialog } from '../dialogs/create-organization/create-organization.dialog';

const PAGE_SIZE = 20;

// «Школы и организации» — макет docs/plan/10-admin-panel-dizayn.html, экран 3
// (Organizations.dc.html), без панели выбранной школы: клик по строке ведёт
// на /platform/orgs/:orgId (план 09 §4.3, F2.1-F2.2).
@Component({
  selector: 'app-organizations-list-page',
  imports: [DialogModule, DatePipe, CraftInput, CraftButton, CraftPagination, CraftEmptyState, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations-list.page.html',
  styleUrl: './organizations-list.page.scss',
})
export class OrganizationsListPage implements OnDestroy {
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly response = signal<ListOrganizationsResponse>({ items: [], totalCount: 0 });

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.search.set(search);
          this.page.set(1);
          this.loading.set(true);
          return this.organizationsApi.listOrganizations({ search, page: 1, pageSize: PAGE_SIZE });
        }),
      )
      .subscribe((response) => {
        this.response.set(response);
        this.loading.set(false);
      });

    this.fetch();

    // Быстрое действие «Создать школу» на дашборде «Обзор» ведёт сюда с
    // ?create=1 вместо дублирования формы создания на двух экранах.
    if (this.route.snapshot.queryParamMap.get('create') === '1') {
      this.createOrganization();
    }
  }

  ngOnDestroy(): void {
    this.searchInput$.complete();
  }

  protected onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    this.fetch();
  }

  protected openOrganization(orgId: string): void {
    void this.router.navigate(['/platform/orgs', orgId]);
  }

  protected createOrganization(): void {
    openCreateOrganizationDialog(this.dialog).closed.subscribe((created) => {
      if (created) {
        void this.router.navigate(['/platform/orgs', created.id]);
      }
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.organizationsApi
      .listOrganizations({ search: this.search(), page: this.page(), pageSize: PAGE_SIZE })
      .subscribe((response) => {
        this.response.set(response);
        this.loading.set(false);
      });
  }
}
