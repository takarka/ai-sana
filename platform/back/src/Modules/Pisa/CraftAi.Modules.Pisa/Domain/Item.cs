namespace CraftAi.Modules.Pisa.Domain;

/// <summary>
/// Составное задание банка PISA: один стимул + несколько вопросов (план 09 §3.6,
/// FR-PSA-01/05/06). Рецензии нет — сохранённое сразу видно ученику (план 07 О2).
/// Автор и дата обязательны (FR-PSA-01) — <see cref="AuthorId"/> мягкая ссылка на
/// <c>identity.users</c>, без FK (план 01 §3).
/// </summary>
public sealed class Item
{
    public Guid Id { get; init; }

    /// <summary>Сериализованный JSON {"text", "chartUrl"?, "sources"?} — текст/график/источники.</summary>
    public required string Stimulus { get; set; }

    /// <summary>Денормализованный текст стимула для полнотекстового поиска (SearchItems).</summary>
    public required string SearchText { get; set; }

    public required ItemDirection Direction { get; set; }

    public required string CognitiveProcess { get; set; }

    public required string Context { get; set; }

    /// <summary>Уровень по шкале PISA, 1…6.</summary>
    public required int Level { get; set; }

    public required int ExpectedTimeMinutes { get; set; }

    /// <summary>Параллели, которым подходит задание, 1…11 (план 07 О3) — иначе семикласснику предложится задание для 2 класса.</summary>
    public required int GradeRangeMin { get; set; }

    public required int GradeRangeMax { get; set; }

    public required Guid AuthorId { get; init; }

    public DateTimeOffset CreatedAtUtc { get; init; }
}
