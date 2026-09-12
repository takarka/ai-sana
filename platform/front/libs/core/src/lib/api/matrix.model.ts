// Зеркала DTO CraftAi.Modules.Content.Features.* (план 09 §3.4, план 06 §1):
// раздел (Section) → урок (Lesson) → шаг урока (материалы/задание, план 09
// §4.4, F3.3-F3.4). QuestionType/QuestionInput — общий контракт вопроса
// закрытого типа (question.model.ts), которым пользуется и Pisa.

import { QuestionInput, QuestionType } from './question.model';

export interface SectionResponse {
  readonly id: string;
  readonly name: string;
  readonly grade: number;
  readonly position: number;
}

export interface CreateSectionRequest {
  readonly name: string;
  readonly grade: number;
}

export interface LessonResponse {
  readonly id: string;
  readonly sectionId: string;
  readonly title: string;
  readonly position: number;
  readonly isPublished: boolean;
  readonly updatedAtUtc: string;
}

export interface CreateLessonRequest {
  readonly sectionId: string;
  readonly title: string;
}

export interface UpdateLessonRequest {
  readonly title: string;
}

// --- Шаги урока: материалы (theory) и задание (task) — план 06 §1, §2 ---

export type StepMaterialType = 'Video' | 'Text' | 'Image' | 'File';

export interface MaterialInput {
  readonly type: StepMaterialType;
  readonly content: string;
}

export interface AddTheoryStepRequest {
  readonly materials: readonly MaterialInput[];
}

export interface StepMaterialDto {
  readonly id: string;
  readonly type: StepMaterialType;
  readonly content: string;
  readonly position: number;
}

// AddTaskStepRequest — то же самое по форме, что QuestionInput
// (questionType/payload/answerKey), отдельного типа не заводим.
export type AddTaskStepRequest = QuestionInput;

export interface QuestionDto {
  readonly id: string;
  readonly type: QuestionType;
  readonly payload: unknown;
  readonly answerKey: unknown;
}

export interface LessonStepDto {
  readonly id: string;
  readonly type: 'Theory' | 'Task';
  readonly position: number;
  readonly materials: readonly StepMaterialDto[] | null;
  readonly question: QuestionDto | null;
}

export interface LessonDetailsResponse {
  readonly id: string;
  readonly sectionId: string;
  readonly title: string;
  readonly position: number;
  readonly isPublished: boolean;
  readonly steps: readonly LessonStepDto[];
}
