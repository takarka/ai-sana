using System.Text.Json;
using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Persistence;
using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.GetLesson;

public static class GetLessonEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapGet("/lessons/{lessonId:guid}", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .WithName("GetLesson");

    private static async Task<IResult> HandleAsync(
        Guid lessonId, HttpContext httpContext, ContentDbContext db, CancellationToken cancellationToken)
    {
        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == lessonId, cancellationToken);
        if (lesson is null)
        {
            return Result.Failure<LessonDetailsResponse>(
                Error.NotFound("lesson.not-found", "Урок не найден.")).ToApiResult(httpContext);
        }

        var steps = await db.LessonSteps.AsNoTracking()
            .Where(s => s.LessonId == lessonId)
            .OrderBy(s => s.Position)
            .ToListAsync(cancellationToken);
        var stepIds = steps.Select(s => s.Id).ToList();

        var materialsByStep = (await db.StepMaterials.AsNoTracking()
                .Where(m => stepIds.Contains(m.LessonStepId))
                .OrderBy(m => m.Position)
                .ToListAsync(cancellationToken))
            .GroupBy(m => m.LessonStepId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var questionsByStep = (await db.Questions.AsNoTracking()
                .Where(q => stepIds.Contains(q.LessonStepId))
                .ToListAsync(cancellationToken))
            .ToDictionary(q => q.LessonStepId);

        var stepDtos = steps.Select(step => step.Type == LessonStepType.Theory
                ? new LessonStepDto(
                    step.Id, step.Type.ToString(), step.Position,
                    materialsByStep.TryGetValue(step.Id, out var materials)
                        ? [.. materials.Select(m => new StepMaterialDto(m.Id, m.Type.ToString(), m.Content, m.Position))]
                        : [],
                    null)
                : new LessonStepDto(
                    step.Id, step.Type.ToString(), step.Position, null,
                    questionsByStep.TryGetValue(step.Id, out var question) ? ToQuestionDto(question) : null))
            .ToList();

        return Result.Success(new LessonDetailsResponse(
                lesson.Id, lesson.SectionId, lesson.Title, lesson.Position, lesson.IsPublished, stepDtos))
            .ToApiResult(httpContext);
    }

    private static QuestionDto ToQuestionDto(Question question) => new(
        question.Id,
        question.Type.ToString(),
        JsonDocument.Parse(question.Payload).RootElement,
        JsonDocument.Parse(question.AnswerKey).RootElement);
}
