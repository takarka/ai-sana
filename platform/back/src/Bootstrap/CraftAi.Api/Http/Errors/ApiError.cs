namespace CraftAi.Api.Http.Errors;

/// <summary>
/// Единый формат ошибки API (API-04). <see cref="Message"/> — техническое сообщение
/// для лога и отладки; пользовательский текст на RU/KZ фронтенд резолвит сам из
/// <see cref="Code"/> через свои словари (ADR-0004) — бэкенд локализацию не хранит.
/// </summary>
public sealed record ApiError(
    string Code,
    string Type,
    string Message,
    string RequestId,
    IReadOnlyDictionary<string, string[]>? Errors = null);
