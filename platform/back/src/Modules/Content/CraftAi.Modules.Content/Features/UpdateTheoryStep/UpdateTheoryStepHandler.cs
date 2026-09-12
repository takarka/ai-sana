using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Features.GetLesson;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.UpdateTheoryStep;

internal static class UpdateTheoryStepHandler
{
    public static async Task<IResult> HandleAsync(
        Guid lessonId, Guid stepId, UpdateTheoryStepRequest request, HttpContext httpContext, ContentDbContext db,
        CancellationToken cancellationToken)
    {
        if (request.Materials is not { Count: > 0 })
        {
            return Result.Failure<LessonStepDto>(
                Error.Validation("theory-step.materials-required", "Нужен хотя бы один материал.")).ToApiResult(httpContext);
        }

        var materials = new List<(StepMaterialType Type, string Content)>(request.Materials.Count);
        foreach (var input in request.Materials)
        {
            if (!Enum.TryParse<StepMaterialType>(input.Type, ignoreCase: true, out var type))
            {
                return Result.Failure<LessonStepDto>(Error.Validation(
                    "theory-step.invalid-material-type", $"Тип материала «{input.Type}» не распознан.")).ToApiResult(httpContext);
            }

            if (string.IsNullOrWhiteSpace(input.Content))
            {
                return Result.Failure<LessonStepDto>(
                    Error.Validation("theory-step.material-content-required", "Содержимое материала обязательно.")).ToApiResult(httpContext);
            }

            materials.Add((type, input.Content.Trim()));
        }

        var step = await db.LessonSteps
            .FirstOrDefaultAsync(s => s.Id == stepId && s.LessonId == lessonId && s.Type == LessonStepType.Theory, cancellationToken);
        if (step is null)
        {
            return Result.Failure<LessonStepDto>(
                Error.NotFound("lesson-step.not-found", "Шаг урока не найден.")).ToApiResult(httpContext);
        }

        var existingMaterials = await db.StepMaterials.Where(m => m.LessonStepId == stepId).ToListAsync(cancellationToken);
        db.StepMaterials.RemoveRange(existingMaterials);

        var stepMaterials = materials.Select((m, index) => new StepMaterial
        {
            Id = Guid.NewGuid(),
            LessonStepId = step.Id,
            Type = m.Type,
            Content = m.Content,
            Position = index,
        }).ToList();
        db.StepMaterials.AddRange(stepMaterials);

        await db.SaveChangesAsync(cancellationToken);

        var dto = new LessonStepDto(
            step.Id, step.Type.ToString(), step.Position,
            [.. stepMaterials.Select(m => new StepMaterialDto(m.Id, m.Type.ToString(), m.Content, m.Position))],
            null);

        return Result.Success(dto).ToApiResult(httpContext);
    }
}
