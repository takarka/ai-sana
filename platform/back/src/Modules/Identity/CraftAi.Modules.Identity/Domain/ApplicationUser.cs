using Microsoft.AspNetCore.Identity;

namespace CraftAi.Modules.Identity.Domain;

/// <summary>
/// Учётная запись контура <c>platform</c> (план 08): суперадмин или методист платформы.
/// Учётки школы (учитель, ученик) заводит план 09 §3.3 (`Organizations`) — эта сущность
/// в A1 покрывает только роли без организации-контекста.
/// </summary>
public sealed class ApplicationUser : IdentityUser<Guid>
{
    public required string FullName { get; set; }

    /// <summary>Язык интерфейса (FR-CORE-07): "ru" | "kk". Меняется профилем — вне A1.</summary>
    public string PreferredLanguage { get; set; } = "ru";

    /// <summary>
    /// Пароль выдан администратором/сидированием и подлежит обязательной смене при
    /// первом входе (план 09 §3.2, A1.5). Снимается после успешного ChangePassword.
    /// </summary>
    public bool MustChangePassword { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }
}
