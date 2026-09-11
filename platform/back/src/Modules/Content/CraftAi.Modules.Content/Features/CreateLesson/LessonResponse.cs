namespace CraftAi.Modules.Content.Features.CreateLesson;

public sealed record LessonResponse(
    Guid Id, Guid SectionId, string Title, int Position, bool IsPublished, DateTimeOffset UpdatedAtUtc);
