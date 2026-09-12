import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url.token';
import { idempotencyHeader } from '../http/idempotency';
import { CreateItemRequest, ItemResponse, SearchItemsResponse, UpdateItemRequest } from './pisa.model';

export interface SearchItemsQuery {
  readonly search?: string;
  readonly direction?: string;
  readonly level?: number;
  readonly grade?: number;
  readonly page?: number;
  readonly pageSize?: number;
}

// Клиент банка заданий PISA (план 09 §3.6, §4.5, F4): составные задания —
// стимул + несколько вопросов с метаданными. Рецензии нет (план 07 О2) —
// сохранённое сразу видно ученику, поэтому здесь только CRUD-набор без
// отдельной команды публикации.
@Injectable({ providedIn: 'root' })
export class PisaApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  searchItems(query: SearchItemsQuery = {}): Observable<SearchItemsResponse> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.direction) params = params.set('direction', query.direction);
    if (query.level) params = params.set('level', query.level);
    if (query.grade) params = params.set('grade', query.grade);
    if (query.page) params = params.set('page', query.page);
    if (query.pageSize) params = params.set('pageSize', query.pageSize);

    return this.http.get<SearchItemsResponse>(`${this.apiBaseUrl}/platform/content/pisa/items`, { params });
  }

  getItem(itemId: string): Observable<ItemResponse> {
    return this.http.get<ItemResponse>(`${this.apiBaseUrl}/platform/content/pisa/items/${itemId}`);
  }

  createItem(request: CreateItemRequest): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(`${this.apiBaseUrl}/platform/content/pisa/items`, request, {
      headers: idempotencyHeader(),
    });
  }

  updateItem(itemId: string, request: UpdateItemRequest): Observable<ItemResponse> {
    return this.http.put<ItemResponse>(`${this.apiBaseUrl}/platform/content/pisa/items/${itemId}`, request, {
      headers: idempotencyHeader(),
    });
  }
}
