namespace CraftAi.Modules.Organizations.Domain;

/// <summary>
/// Учётная запись учителя/ученика в рамках школы. <see cref="UserId"/> — мягкая ссылка на
/// <c>identity.users</c> (без FK: план 01 §3 запрещает прямые ссылки на внутренности чужого
/// модуля; пользователь заведён через <c>Identity.Contracts.IUserProvisioningService</c>).
/// </summary>
public sealed class OrganizationMember
{
    public Guid Id { get; init; }

    public required Guid OrganizationId { get; init; }

    public required Guid UserId { get; init; }

    public required OrganizationMemberRole Role { get; set; }

    /// <summary>Обязателен для ученика, пуст для учителя (план 08 О2 / план 09 §3.3).</summary>
    public Guid? ClassGroupId { get; set; }

    /// <summary>ИИН или другой внешний идентификатор — сопоставление при повторном импорте (FR-CORE-08).</summary>
    public string? ExternalId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; init; }
}
