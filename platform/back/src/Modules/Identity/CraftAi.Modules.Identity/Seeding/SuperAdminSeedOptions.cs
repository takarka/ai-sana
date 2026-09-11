namespace CraftAi.Modules.Identity.Seeding;

/// <summary>
/// Откуда берётся первый суперадмин (план 09 §7, О5): из конфигурации окружения,
/// не из кода и не из миграции. Оба поля обязательны только при ПЕРВОМ запуске —
/// после того как суперадмин заведён, <see cref="IdentitySeeder"/> их не читает.
/// </summary>
public sealed class SuperAdminSeedOptions
{
    public const string SectionName = "Identity:SuperAdmin";

    public string? Email { get; init; }

    public string? InitialPassword { get; init; }

    public string FullName { get; init; } = "Суперадминистратор";
}
