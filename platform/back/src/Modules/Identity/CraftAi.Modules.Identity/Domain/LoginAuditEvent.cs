namespace CraftAi.Modules.Identity.Domain;

public enum LoginAuditEventType
{
    LoginSucceeded,
    LoginFailed,
    TokenRefreshed,
    RefreshReuseDetected,
    Logout,
    PasswordChanged,
}

/// <summary>
/// Журнал аудита входов (FR-CORE-11): вход, отказ, обновление токена, обнаруженный
/// повтор отозванного refresh-токена, выход, смена пароля. Пишется и никогда не
/// правится и не удаляется прикладным кодом — это единственная гарантия неизменности
/// в срезе A1, без триггеров БД (сверх заявленного размера задачи).
/// <see cref="UserId"/> пуст, если логин не удалось сопоставить с учётной записью
/// (например, неизвестный e-mail) — тогда событие фиксирует только сам факт попытки.
/// </summary>
public sealed class LoginAuditEvent
{
    public Guid Id { get; set; }

    public DateTimeOffset OccurredAtUtc { get; set; }

    public Guid? UserId { get; set; }

    public LoginAuditEventType EventType { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public string? Details { get; set; }
}
