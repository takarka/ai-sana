using System.Text.Json;

namespace CraftAi.Modules.Content.Features.GetLesson;

public sealed record StepMaterialDto(Guid Id, string Type, string Content, int Position);

public sealed record QuestionDto(Guid Id, string Type, JsonElement Payload, JsonElement AnswerKey);

public sealed record LessonStepDto(
    Guid Id, string Type, int Position, IReadOnlyList<StepMaterialDto>? Materials, QuestionDto? Question);

public sealed record LessonDetailsResponse(
    Guid Id, Guid SectionId, string Title, int Position, bool IsPublished, IReadOnlyList<LessonStepDto> Steps);
