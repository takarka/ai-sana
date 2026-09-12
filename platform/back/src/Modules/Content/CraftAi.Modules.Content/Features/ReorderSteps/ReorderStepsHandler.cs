using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.ReorderSteps;

/// <summary>
/// Задаёт новый порядок шагов урока — запрос должен назвать ровно тот же набор id,
/// что уже есть у урока (план 09 §3.4), иначе шаг случайно бы выпал из урока.
/// </summary>
internal static class ReorderStepsHandler
{
    public static async Task<IResult> HandleAsync(
        Guid lessonId, ReorderStepsRequest request, HttpContext httpContext, ContentDbContext db,
        CancellationToken cancellationToken)
    {
        if (!await db.Lessons.AsNoTracking().AnyAsync(l => l.Id == lessonId, cancellationToken))
        {
            return Result.Failure(Error.NotFound("lesson.not-found", "Урок не найден.")).ToApiResult(httpContext);
        }

        var steps = await db.LessonSteps.Where(s => s.LessonId == lessonId).ToListAsync(cancellationToken);
        var requestedIds = request.StepIds ?? [];
        var existingIds = steps.Select(s => s.Id).ToHashSet();
        if (requestedIds.Count != steps.Count || requestedIds.Distinct().Count() != requestedIds.Count
            || !requestedIds.All(existingIds.Contains))
        {
            return Result.Failure(Error.Validation(
                "lesson-step.invalid-order", "Новый порядок должен содержать ровно те же шаги урока, без повторов и пропусков.")).ToApiResult(httpContext);
        }

        var stepsById = steps.ToDictionary(s => s.Id);
        for (var index = 0; index < requestedIds.Count; index++)
        {
            stepsById[requestedIds[index]].Position = index;
        }

        await db.SaveChangesAsync(cancellationToken);

        return Result.Success().ToApiResult(httpContext);
    }
}
