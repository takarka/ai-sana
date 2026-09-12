using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.DeleteStep;

/// <summary>
/// Удаляет шаг урока (каскадно удаляются его материалы/вопрос, план 01 §5) и
/// перенумеровывает позиции оставшихся шагов, чтобы не оставалось разрывов.
/// </summary>
internal static class DeleteStepHandler
{
    public static async Task<IResult> HandleAsync(
        Guid lessonId, Guid stepId, HttpContext httpContext, ContentDbContext db, CancellationToken cancellationToken)
    {
        var step = await db.LessonSteps.FirstOrDefaultAsync(s => s.Id == stepId && s.LessonId == lessonId, cancellationToken);
        if (step is null)
        {
            return Result.Failure(Error.NotFound("lesson-step.not-found", "Шаг урока не найден.")).ToApiResult(httpContext);
        }

        db.LessonSteps.Remove(step);

        var remaining = await db.LessonSteps
            .Where(s => s.LessonId == lessonId && s.Id != stepId)
            .OrderBy(s => s.Position)
            .ToListAsync(cancellationToken);
        for (var index = 0; index < remaining.Count; index++)
        {
            remaining[index].Position = index;
        }

        await db.SaveChangesAsync(cancellationToken);

        return Result.Success().ToApiResult(httpContext);
    }
}
