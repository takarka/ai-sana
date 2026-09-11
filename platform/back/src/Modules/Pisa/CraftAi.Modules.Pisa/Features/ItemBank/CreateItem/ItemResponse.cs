using System.Text.Json;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

public sealed record ItemQuestionDto(Guid Id, int Position, string Type, JsonElement Payload, JsonElement AnswerKey);

public sealed record ItemResponse(
    Guid Id,
    JsonElement Stimulus,
    string Direction,
    string CognitiveProcess,
    string Context,
    int Level,
    int ExpectedTimeMinutes,
    int GradeRangeMin,
    int GradeRangeMax,
    Guid AuthorId,
    DateTimeOffset CreatedAtUtc,
    IReadOnlyList<ItemQuestionDto> Questions);
