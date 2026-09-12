import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url.token';
import { idempotencyHeader } from '../http/idempotency';
import {
  AddTaskStepRequest,
  CreateLessonRequest,
  CreateSectionRequest,
  LessonDetailsResponse,
  LessonResponse,
  LessonStepDto,
  MaterialInput,
  ReorderStepsRequest,
  SectionResponse,
  UpdateLessonRequest,
  UpdateTaskStepRequest,
  UpdateTheoryStepRequest,
} from './matrix.model';

export interface ListLessonsQuery {
  readonly sectionId?: string;
  readonly grade?: number;
}

// Один клиент на узкий срез авторинга MATRIX (план 09 §3.4, §4.4, F3.1-F3.4):
// разделы, уроки и их шаги — материалы (theory) и задания (task), с
// возможностью редактировать, удалять и переупорядочивать уже сохранённые шаги.
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

  getLesson(lessonId: string): Observable<LessonDetailsResponse> {
    return this.http.get<LessonDetailsResponse>(`${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}`);
  }

  addTheoryStep(lessonId: string, materials: readonly MaterialInput[]): Observable<LessonStepDto> {
    return this.http.post<LessonStepDto>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}/steps/theory`,
      { materials },
      { headers: idempotencyHeader() },
    );
  }

  addTaskStep(lessonId: string, request: AddTaskStepRequest): Observable<LessonStepDto> {
    return this.http.post<LessonStepDto>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}/steps/task`,
      request,
      { headers: idempotencyHeader() },
    );
  }

  updateTheoryStep(lessonId: string, stepId: string, request: UpdateTheoryStepRequest): Observable<LessonStepDto> {
    return this.http.put<LessonStepDto>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}/steps/${stepId}/theory`,
      request,
      { headers: idempotencyHeader() },
    );
  }

  updateTaskStep(lessonId: string, stepId: string, request: UpdateTaskStepRequest): Observable<LessonStepDto> {
    return this.http.put<LessonStepDto>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}/steps/${stepId}/task`,
      request,
      { headers: idempotencyHeader() },
    );
  }

  deleteStep(lessonId: string, stepId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}/steps/${stepId}`,
      { headers: idempotencyHeader() },
    );
  }

  reorderSteps(lessonId: string, request: ReorderStepsRequest): Observable<void> {
    return this.http.put<void>(
      `${this.apiBaseUrl}/platform/content/matrix/lessons/${lessonId}/steps/reorder`,
      request,
      { headers: idempotencyHeader() },
    );
  }
}
