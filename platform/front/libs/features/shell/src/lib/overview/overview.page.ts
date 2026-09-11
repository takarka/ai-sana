import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrganizationsApi, TranslatePipe } from '@front/core';

// Дашборд по умолчанию после входа — макет docs/plan/10-admin-panel-dizayn.html,
// экран 2. KPI на макете иллюстративные (школы/ученики/уроки/PISA) — бэкенд
// сейчас отдаёт только количество школ (ListOrganizations.totalCount), поэтому
// в код идёт только эта цифра, а не выдуманные показатели (план 09 §4 не
// описывает отдельный дашборд-эндпоинт).
@Component({
  selector: 'app-overview-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage {
  private readonly organizationsApi = inject(OrganizationsApi);

  protected readonly organizationsCount = signal<number | null>(null);

  constructor() {
    this.organizationsApi.listOrganizations({ pageSize: 1 }).subscribe({
      next: (response) => this.organizationsCount.set(response.totalCount),
      error: () => this.organizationsCount.set(null),
    });
  }
}
