import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url.token';
import { idempotencyHeader } from '../http/idempotency';
import {
  CreateLessonRequest,
  CreateSectionRequest,
  LessonResponse,
  SectionResponse,
  UpdateLessonRequest,
} from './matrix.model';

export interface ListLessonsQuery {
  readonly sectionId?: string;
  readonly grade?: number;
}

// Один клиент на узкий срез авторинга MATRIX (план 09 §3.4, §4.4, F3.1-F3.2):
// разделы и уроки. Материалы урока и задание шага (AddTheoryStep/AddTaskStep)
// сознательно не подключены — это отдельный редактор F3.3-F3.4, вне этого среза.
@Injectable({ providedIn: 'root' })
export class MatrixApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  listSections(grade?: number): Observable<readonly SectionResponse[]> {
    let params = new HttpParams();
    if (grade) params = params.set('grade', grade);

    return this.http.get<readonly SectionResponse[]>(`${this.apiBaseUrl}/platform/content/matrix/sections`, {
      params,
    });
  }

  createSection(request: CreateSectionRequest): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(`${this.apiBaseUrl}/platform/content/matrix/sections`, request, {
      headers: idempotencyHeader(),
    });
  }

  listLessons(query: ListLessonsQuery = {}): Observable<readonly LessonResponse[]> {
    let params = new HttpParams();
    if (query.sectionId) params = params.set('sectionId', query.sectionId);
    if (query.grade) params = params.set('grade', query.grade);

    return this.http.get<readonly LessonResponse[]>(`${this.apiBaseUrl}/platform/content/matrix/lessons`, {
      params,
    });
  }

  createLesson(request: CreateLessonRequest): Observable<LessonResponse> {
    return this.http.post<LessonResponse>(`${this.apiBaseUrl}/platform/content/matrix/lessons`, request, {
      headers: idempotencyHeader(),
    });
  }

  updateLesson(lessonId: string, request: UpdateLessonRequest): Observable<LessonResponse> {
    return this.http.put<LessonResponse>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}`,
      request,
      { headers: idempotencyHeader() },
    );
  }
}
