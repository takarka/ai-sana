// Восемь типов заданий закрытого типа (план 06 §2, FR-CMS-02) — общий набор
// для CraftAi.Modules.Assessment, которым пользуются оба модуля авторинга,
// Content (MATRIX) и Pisa (план 09 §3.5). Тип и форма payload/answerKey —
// зеркало CraftAi.Modules.Assessment.Contracts.QuestionType и
// QuestionValidationService.

export type QuestionType =
  | 'SingleChoice'
  | 'MultipleChoice'
  | 'Matching'
  | 'Ordering'
  | 'FillInBlank'
  | 'NumericTolerance'
  | 'ShortText'
  | 'DragAndDrop';

// payload/answerKey — сырой JSON, структуру каждого типа проверяет бэкенд
// (QuestionValidationService); здесь нетипизированные объекты, форму строит
// CraftQuestionEditor по QuestionType.
export interface QuestionInput {
  readonly questionType: QuestionType;
  readonly payload: unknown;
  readonly answerKey: unknown;
}

// Достаточно для восстановления черновика редактора (questionDraftFromDto) —
// не привязано к конкретному DTO модуля (ItemQuestionDto в Pisa, QuestionDto
// в Content несут те же три поля плюс свои специфичные).
export interface QuestionLike {
  readonly type: QuestionType;
  readonly payload: unknown;
  readonly answerKey: unknown;
}
