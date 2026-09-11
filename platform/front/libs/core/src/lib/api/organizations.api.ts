import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url.token';
import { idempotencyHeader } from '../http/idempotency';
import {
  ClassGroupResponse,
  CreateClassGroupRequest,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  CreateUserAccountRequest,
  CreateUserAccountResponse,
  GetOrganizationResponse,
  ListOrganizationsResponse,
  UserAccountSummary,
} from './organizations.model';

export interface ListOrganizationsQuery {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ListUserAccountsQuery {
  readonly role?: string;
  readonly classGroupId?: string;
}

// Один клиент на модуль Organizations (план 09 §5) — школы, классы, учётные
// записи. Импорт XLSX (PreviewImport/CommitImport) сознательно вне этого
// среза фронтенда, см. docs/plan/09-admin-panel-razrabotka.md §4.3, F2.6-2.8.
@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listOrganizations(query: ListOrganizationsQuery = {}): Observable<ListOrganizationsResponse> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);

    return this.http.get<ListOrganizationsResponse>(`${this.apiBaseUrl}/platform/orgs`, { params });
  }

  createOrganization(request: CreateOrganizationRequest): Observable<CreateOrganizationResponse> {
    return this.http.post<CreateOrganizationResponse>(`${this.apiBaseUrl}/platform/orgs`, request, {
      headers: idempotencyHeader(),
    });
  }

  getOrganization(orgId: string): Observable<GetOrganizationResponse> {
    return this.http.get<GetOrganizationResponse>(`${this.apiBaseUrl}/platform/orgs/${orgId}`);
  }

  listClassGroups(orgId: string): Observable<readonly ClassGroupResponse[]> {
    return this.http.get<readonly ClassGroupResponse[]>(`${this.apiBaseUrl}/platform/orgs/${orgId}/classes`);
  }

  createClassGroup(orgId: string, request: CreateClassGroupRequest): Observable<ClassGroupResponse> {
    return this.http.post<ClassGroupResponse>(
      `${this.apiBaseUrl}/platform/orgs/${orgId}/classes`,
      request,
      { headers: idempotencyHeader() },
    );
  }

  listUserAccounts(orgId: string, query: ListUserAccountsQuery = {}): Observable<readonly UserAccountSummary[]> {
    let params = new HttpParams();
    if (query.role) params = params.set('role', query.role);
    if (query.classGroupId) params = params.set('classGroupId', query.classGroupId);

    return this.http.get<readonly UserAccountSummary[]>(`${this.apiBaseUrl}/platform/orgs/${orgId}/users`, {
      params,
    });
  }

  createUserAccount(orgId: string, request: CreateUserAccountRequest): Observable<CreateUserAccountResponse> {
    return this.http.post<CreateUserAccountResponse>(
      `${this.apiBaseUrl}/platform/orgs/${orgId}/users`,
      request,
      { headers: idempotencyHeader() },
    );
  }
}
