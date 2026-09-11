namespace CraftAi.Modules.Pisa.Features.ItemBank.SearchItems;

public sealed record ItemSummary(
    Guid Id,
    string StimulusText,
    string Direction,
    string CognitiveProcess,
    string Context,
    int Level,
    int ExpectedTimeMinutes,
    int GradeRangeMin,
    int GradeRangeMax,
    Guid AuthorId,
    DateTimeOffset CreatedAtUtc,
    int QuestionCount);

public sealed record SearchItemsResponse(IReadOnlyList<ItemSummary> Items, int TotalCount);
