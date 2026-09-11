namespace CraftAi.Modules.Organizations.Domain;

/// <summary>Класс: параллель + литера в рамках учебного года (план 09 §3.3, A2.3).</summary>
public sealed class ClassGroup
{
    public Guid Id { get; init; }

    public required Guid OrganizationId { get; init; }

    public required Guid AcademicYearId { get; init; }

    /// <summary>Параллель, 1…11.</summary>
    public required int Grade { get; set; }

    /// <summary>Литера, например "А".</summary>
    public required string Letter { get; set; }
}
