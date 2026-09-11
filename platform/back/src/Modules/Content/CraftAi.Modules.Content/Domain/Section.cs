namespace CraftAi.Modules.Content.Domain;

/// <summary>Раздел курса MATRIX для конкретной параллели (план 09 §3.4, A3.2).</summary>
public sealed class Section
{
    public Guid Id { get; init; }

    public required string Name { get; set; }

    /// <summary>Параллель, 1…11 — «курс = модуль + параллель» (план 06 §1), без отдельной сущности курса в v0.</summary>
    public required int Grade { get; set; }

    public int Position { get; set; }

    public DateTimeOffset CreatedAtUtc { get; init; }
}
