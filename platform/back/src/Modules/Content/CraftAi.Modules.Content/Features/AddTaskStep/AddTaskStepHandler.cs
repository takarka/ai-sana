using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Features.GetLesson;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.AddTaskStep;

internal static class AddTaskStepHandler
{
    public static async Task<IResult> HandleAsync(
        Guid lessonId, AddTaskStepRequest request, HttpContext httpContext, ContentDbContext db,
        IQuestionValidationService validation, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<QuestionType>(request.QuestionType, ignoreCase: true, out var questionType))
        {
            return Result.Failure<LessonStepDto>(Error.Validation(
                "task-step.invalid-question-type", $"Тип вопроса «{request.QuestionType}» не распознан.")).ToApiResult(httpContext);
        }

        var validationResult = validation.Validate(questionType, request.Payload, request.AnswerKey);
        if (validationResult.IsFailure)
        {
            return validationResult.ToApiResult(httpContext);
        }

        if (!await db.Lessons.AsNoTracking().AnyAsync(l => l.Id == lessonId, cancellationToken))
        {
            return Result.Failure<LessonStepDto>(
                Error.NotFound("lesson.not-found", "Урок не найден.")).ToApiResult(httpContext);
        }

        var position = await db.LessonSteps.Where(s => s.LessonId == lessonId).CountAsync(cancellationToken);

        var step = new LessonStep { Id = Guid.NewGuid(), LessonId = lessonId, Type = LessonStepType.Task, Position = position };
        db.LessonSteps.Add(step);

        var question = new Question
        {
            Id = Guid.NewGuid(),
            LessonStepId = step.Id,
            Type = questionType,
            Payload = request.Payload.GetRawText(),
            AnswerKey = request.AnswerKey.GetRawText(),
        };
        db.Questions.Add(question);

        await db.SaveChangesAsync(cancellationToken);

        var dto = new LessonStepDto(
            step.Id, step.Type.ToString(), step.Position, null,
            new QuestionDto(question.Id, question.Type.ToString(), request.Payload, request.AnswerKey));

        return Result.Success(dto).ToApiResult(httpContext, value => Results.Created(
            $"/platform/content/matrix/lessons/{lessonId}", value));
    }
}
