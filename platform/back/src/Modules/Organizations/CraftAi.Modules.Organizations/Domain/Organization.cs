namespace CraftAi.Modules.Organizations.Domain;

/// <summary>Школа (план 08 §4: в v0 обязательно только название).</summary>
public sealed class Organization
{
    public Guid Id { get; init; }

    public required string Name { get; set; }

    public string? Region { get; set; }

    public DateTimeOffset CreatedAtUtc { get; init; }
}
