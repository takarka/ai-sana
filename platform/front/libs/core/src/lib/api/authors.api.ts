import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url.token';
import { idempotencyHeader } from '../http/idempotency';
import { AuthorAccountSummary, CreateAuthorAccountRequest, CreateAuthorAccountResponse } from './authors.model';

// Учётные записи методистов платформы (роль `author`) — отдельный клиент от
// OrganizationsApi, потому что у методиста нет организации-контекста (план 08 §2).
@Injectable({ providedIn: 'root' })
export class AuthorsApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listAuthorAccounts(): Observable<readonly AuthorAccountSummary[]> {
    return this.http.get<readonly AuthorAccountSummary[]>(`${this.apiBaseUrl}/platform/authors`);
  }

  createAuthorAccount(request: CreateAuthorAccountRequest): Observable<CreateAuthorAccountResponse> {
    return this.http.post<CreateAuthorAccountResponse>(`${this.apiBaseUrl}/platform/authors`, request, {
      headers: idempotencyHeader(),
    });
  }
}
