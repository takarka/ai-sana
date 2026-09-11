// Зеркала DTO CraftAi.Modules.Identity.Features.Accounts.* — учётные записи
// методистов платформы (роль `author`, план 08 §2). Нет организации-контекста,
// в отличие от учителей/учеников из organizations.model.ts.

export interface CreateAuthorAccountRequest {
  readonly fullName: string;
}

export interface CreateAuthorAccountResponse {
  readonly userId: string;
  readonly login: string;
  readonly generatedPassword: string;
  readonly fullName: string;
}

export interface AuthorAccountSummary {
  readonly userId: string;
  readonly fullName: string;
  readonly login: string;
  readonly mustChangePassword: boolean;
  readonly createdAtUtc: string;
}
