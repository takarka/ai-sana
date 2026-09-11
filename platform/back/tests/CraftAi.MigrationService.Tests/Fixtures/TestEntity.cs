namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>Минимальная сущность — только чтобы было что мигрировать в тесте.</summary>
public sealed class TestEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;
}
