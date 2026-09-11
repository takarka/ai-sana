namespace CraftAi.Modules.Identity.Domain;

/// <summary>
/// Один refresh-токен в цепочке ротации. Все токены, выданные из одного входа и его
/// последующих обновлений, делят <see cref="FamilyId"/> — повторное использование уже
/// отозванного токена гасит всю семью (план 09 §3.2, A1.3; API-02).
/// Хранится хеш токена, не сырое значение — так же, как пароли.
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid FamilyId { get; set; }

    public required string TokenHash { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }

    public DateTimeOffset? RevokedAtUtc { get; set; }

    /// <summary>Токен, которым этот заменён при ротации — цепочка семьи.</summary>
    public Guid? ReplacedByTokenId { get; set; }

    /// <summary>User-Agent на момент выдачи — только для аудита (API-02: «привязаны к устройству»).</summary>
    public string? DeviceInfo { get; set; }

    public bool IsActive => RevokedAtUtc is null && ExpiresAtUtc > DateTimeOffset.UtcNow;
}
