namespace CraftAi.Modules.Organizations.Domain;

/// <summary>
/// Учебный год школы. Создаётся автоматически вместе с <see cref="Organization"/>
/// (план 09 §3.3, A2.2) — без него нельзя создать <see cref="ClassGroup"/>.
/// </summary>
public sealed class AcademicYear
{
    public Guid Id { get; init; }

    public required Guid OrganizationId { get; init; }

    public required string Name { get; set; }

    public required DateOnly StartsOn { get; set; }

    public required DateOnly EndsOn { get; set; }
}
