// Зеркала DTO CraftAi.Modules.Content.Features.* (план 09 §3.4, план 06 §1):
// раздел (Section) → урок (Lesson). Материалы и задания шага (§3.3, F3.3-F3.4
// плана 09) — вне этого среза, здесь только дерево «раздел → уроки».

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
