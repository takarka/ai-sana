// Заголовок Idempotency-Key (API-07) обязателен на всех записывающих
// эндпоинтах, помеченных на бэкенде RequireIdempotencyKey() — CreateOrganization,
// CreateClassGroup, CreateUserAccount, ChangePassword и т.д.
export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function idempotencyHeader(): Record<string, string> {
  return { 'Idempotency-Key': createIdempotencyKey() };
}
