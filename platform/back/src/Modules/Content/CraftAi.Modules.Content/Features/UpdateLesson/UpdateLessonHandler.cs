using CraftAi.Modules.Content.Features.CreateLesson;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;

namespace CraftAi.Modules.Content.Features.UpdateLesson;

internal static class UpdateLessonHandler
{
    public static async Task<IResult> HandleAsync(
        Guid lessonId, UpdateLessonRequest request, HttpContext httpContext, ContentDbContext db,
        TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Result.Failure<LessonResponse>(
                Error.Validation("lesson.title-required", "Название урока обязательно.")).ToApiResult(httpContext);
        }

        var lesson = await db.Lessons.FindAsync([lessonId], cancellationToken);
        if (lesson is null)
        {
            return Result.Failure<LessonResponse>(
                Error.NotFound("lesson.not-found", "Урок не найден.")).ToApiResult(httpContext);
        }

        lesson.Title = request.Title.Trim();
        lesson.UpdatedAtUtc = timeProvider.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(CreateLessonHandler.ToResponse(lesson)).ToApiResult(httpContext);
    }
}
