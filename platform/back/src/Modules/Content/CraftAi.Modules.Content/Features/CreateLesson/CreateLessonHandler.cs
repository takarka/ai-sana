using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.CreateLesson;

internal static class CreateLessonHandler
{
    public static async Task<IResult> HandleAsync(
        CreateLessonRequest request, HttpContext httpContext, ContentDbContext db,
        TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Result.Failure<LessonResponse>(
                Error.Validation("lesson.title-required", "Название урока обязательно.")).ToApiResult(httpContext);
        }

        if (!await db.Sections.AsNoTracking().AnyAsync(s => s.Id == request.SectionId, cancellationToken))
        {
            return Result.Failure<LessonResponse>(
                Error.NotFound("section.not-found", "Раздел не найден.")).ToApiResult(httpContext);
        }

        var position = await db.Lessons.Where(l => l.SectionId == request.SectionId).CountAsync(cancellationToken);
        var now = timeProvider.GetUtcNow();

        // Публикация — не отдельная команда: сохранение сразу помечает урок
        // опубликованным (план 08 §5, план 09 §3.4).
        var lesson = new Lesson
        {
            Id = Guid.NewGuid(),
            SectionId = request.SectionId,
            Title = request.Title.Trim(),
            Position = position,
            IsPublished = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.Lessons.Add(lesson);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(ToResponse(lesson))
            .ToApiResult(httpContext, value => Results.Created($"/platform/content/matrix/lessons/{value.Id}", value));
    }

    internal static LessonResponse ToResponse(Lesson lesson) =>
        new(lesson.Id, lesson.SectionId, lesson.Title, lesson.Position, lesson.IsPublished, lesson.UpdatedAtUtc);
}
