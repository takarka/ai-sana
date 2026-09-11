namespace CraftAi.SharedKernel;

/// <summary>
/// Тип ошибки — определяет, в какой HTTP-статус её отображает API (API-04).
/// </summary>
public enum ErrorType
{
    Failure,
    Validation,
    NotFound,
    Conflict,
    Forbidden,
    Unauthorized,
}

/// <summary>
/// Доменная ошибка: код + сообщение, без исключений для ожидаемых сбоев.
/// Ключи RU/KZ для <see cref="Message"/> резолвит слой API, здесь — только код.
/// </summary>
public sealed record Error(string Code, string Message, ErrorType Type)
{
    public static Error Failure(string code, string message) => new(code, message, ErrorType.Failure);

    public static Error Validation(string code, string message) => new(code, message, ErrorType.Validation);

    public static Error NotFound(string code, string message) => new(code, message, ErrorType.NotFound);

    public static Error Conflict(string code, string message) => new(code, message, ErrorType.Conflict);

    public static Error Forbidden(string code, string message) => new(code, message, ErrorType.Forbidden);

    public static Error Unauthorized(string code, string message) => new(code, message, ErrorType.Unauthorized);
}
