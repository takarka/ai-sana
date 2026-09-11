namespace CraftAi.Modules.Content.Domain;

/// <summary>
/// Урок раздела. Публикация не отдельная команда — сохранение сразу помечает урок
/// опубликованным (план 08 §5, план 09 §3.4).
/// </summary>
public sealed class Lesson
{
    public Guid Id { get; init; }

    public required Guid SectionId { get; init; }

    public required string Title { get; set; }

    public int Position { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTimeOffset CreatedAtUtc { get; init; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}
