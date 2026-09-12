// Зеркала DTO CraftAi.Modules.Pisa.Features.ItemBank.* (план 09 §3.6, план 07 §4):
// составное задание банка PISA — один стимул + несколько вопросов из общего
// закрытого набора типов (план 06 §2, FR-CMS-02), которым пользуется и MATRIX.
// QuestionType/QuestionInput — общий контракт вопроса, см. question.model.ts.

import { QuestionInput, QuestionType } from './question.model';

export type PisaDirection = 'Math' | 'Science' | 'Reading';

export interface StimulusInput {
  readonly text: string;
  readonly chartUrl?: string | null;
  readonly sources?: readonly string[] | null;
}

export interface CreateItemRequest {
  readonly stimulus: StimulusInput;
  readonly direction: string;
  readonly cognitiveProcess: string;
  readonly context: string;
  readonly level: number;
  readonly expectedTimeMinutes: number;
  readonly gradeRangeMin: number;
  readonly gradeRangeMax: number;
  readonly questions: readonly QuestionInput[];
}

export type UpdateItemRequest = CreateItemRequest;

export interface ItemQuestionDto {
  readonly id: string;
  readonly position: number;
  readonly type: QuestionType;
  readonly payload: unknown;
  readonly answerKey: unknown;
}

export interface ItemResponse {
  readonly id: string;
  readonly stimulus: { readonly text: string; readonly chartUrl?: string | null; readonly sources?: readonly string[] | null };
  readonly direction: PisaDirection;
  readonly cognitiveProcess: string;
  readonly context: string;
  readonly level: number;
  readonly expectedTimeMinutes: number;
  readonly gradeRangeMin: number;
  readonly gradeRangeMax: number;
  readonly authorId: string;
  readonly createdAtUtc: string;
  readonly questions: readonly ItemQuestionDto[];
}

export interface ItemSummary {
  readonly id: string;
  readonly stimulusText: string;
  readonly direction: PisaDirection;
  readonly cognitiveProcess: string;
  readonly context: string;
  readonly level: number;
  readonly expectedTimeMinutes: number;
  readonly gradeRangeMin: number;
  readonly gradeRangeMax: number;
  readonly authorId: string;
  readonly createdAtUtc: string;
  readonly questionCount: number;
}

export interface SearchItemsResponse {
  readonly items: readonly ItemSummary[];
  readonly totalCount: number;
}
