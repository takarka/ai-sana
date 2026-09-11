import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ClassGroupResponse,
  GetOrganizationResponse,
  OrganizationsApi,
  TranslatePipe,
  UserAccountSummary,
} from '@front/core';
import { CraftButton, CraftEmptyState } from '@front/ui';
import { openCreateClassGroupDialog } from '../dialogs/create-class-group/create-class-group.dialog';
import { openCreateUserAccountDialog } from '../dialogs/create-user-account/create-user-account.dialog';
import { openCredentialsRevealDialog } from '../dialogs/credentials-reveal/credentials-reveal.dialog';

type RoleFilter = 'all' | 'teacher' | 'student';

// Панель школы — макет docs/plan/10-admin-panel-dizayn.html, экран 3, правая
// часть, но как отдельный маршрут /platform/orgs/:orgId (план 09 §4.3,
// F2.3-F2.5, F2.8). Импорт XLSX (F2.6-F2.7) сознательно не входит в этот срез.
@Component({
  selector: 'app-organization-detail-page',
  imports: [DialogModule, DatePipe, RouterLink, CraftButton, CraftEmptyState, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-detail.page.html',
  styleUrl: './organization-detail.page.scss',
})
export class OrganizationDetailPage {
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly dialog = inject(Dialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly orgId = this.route.snapshot.paramMap.get('orgId') ?? '';

  protected readonly organization = signal<GetOrganizationResponse | null>(null);
  protected readonly classGroups = signal<readonly ClassGroupResponse[]>([]);
  protected readonly users = signal<readonly UserAccountSummary[]>([]);
  protected readonly roleFilter = signal<RoleFilter>('all');
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  protected readonly classLabelById = computed(() => {
    const map = new Map<string, string>();
    for (const group of this.classGroups()) {
      map.set(group.id, `${group.grade}${group.letter}`);
    }
    return map;
  });

  constructor() {
    if (!this.orgId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.organizationsApi.getOrganization(this.orgId).subscribe({
      next: (organization) => {
        this.organization.set(organization);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
    this.loadClassGroups();
    this.loadUsers();
  }

  protected addClass(): void {
    openCreateClassGroupDialog(this.dialog, { orgId: this.orgId }).closed.subscribe((created) => {
      if (created) this.loadClassGroups();
    });
  }

  protected addUser(): void {
    openCreateUserAccountDialog(this.dialog, { orgId: this.orgId, classGroups: this.classGroups() }).closed.subscribe(
      (created) => {
        if (!created) return;
        this.loadUsers();
        openCredentialsRevealDialog(this.dialog, {
          login: created.login,
          password: created.generatedPassword,
        });
      },
    );
  }

  protected setRoleFilter(role: RoleFilter): void {
    this.roleFilter.set(role);
    this.loadUsers();
  }

  protected backToList(): void {
    void this.router.navigateByUrl('/platform/orgs');
  }

  private loadClassGroups(): void {
    this.organizationsApi.listClassGroups(this.orgId).subscribe((groups) => this.classGroups.set(groups));
  }

  private loadUsers(): void {
    const role = this.roleFilter();
    this.organizationsApi
      .listUserAccounts(this.orgId, { role: role === 'all' ? undefined : role })
      .subscribe((users) => this.users.set(users));
  }
}
