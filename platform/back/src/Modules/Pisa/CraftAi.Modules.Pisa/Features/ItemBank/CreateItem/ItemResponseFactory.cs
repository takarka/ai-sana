using CraftAi.Modules.Pisa.Domain;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

internal static class ItemResponseFactory
{
    public static ItemResponse ToResponse(Item item, IReadOnlyList<ItemQuestion> questions) => new(
        item.Id,
        PisaJson.Parse(item.Stimulus),
        item.Direction.ToString(),
        item.CognitiveProcess,
        item.Context,
        item.Level,
        item.ExpectedTimeMinutes,
        item.GradeRangeMin,
        item.GradeRangeMax,
        item.AuthorId,
        item.CreatedAtUtc,
        [.. questions
            .OrderBy(q => q.Position)
            .Select(q => new ItemQuestionDto(
                q.Id, q.Position, q.Type.ToString(),
                PisaJson.Parse(q.Payload), PisaJson.Parse(q.AnswerKey)))]);
}
