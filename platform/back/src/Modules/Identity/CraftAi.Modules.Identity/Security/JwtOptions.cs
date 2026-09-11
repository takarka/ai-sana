using System.ComponentModel.DataAnnotations;

namespace CraftAi.Modules.Identity.Security;

/// <summary>
/// Настройка выдачи JWT (API-02). <see cref="SigningKey"/> — обязательный секрет:
/// в продакшене приходит из переменных окружения/секрет-хранилища, в разработке —
/// через `dotnet user-secrets`. Отсутствие ключа роняет хост на старте
/// (см. <c>ValidateOnStart</c> в <see cref="IdentityModule"/>), а не на первом запросе.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public required string Issuer { get; init; }

    [Required]
    public required string Audience { get; init; }

    [Required]
    [MinLength(32, ErrorMessage = "Jwt:SigningKey должен быть не короче 32 символов (HMAC-SHA256).")]
    public required string SigningKey { get; init; }

    /// <summary>API-02: короткоживущий access-токен, не более 15 минут.</summary>
    public TimeSpan AccessTokenLifetime { get; init; } = TimeSpan.FromMinutes(15);

    public TimeSpan RefreshTokenLifetime { get; init; } = TimeSpan.FromDays(30);
}
