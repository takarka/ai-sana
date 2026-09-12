using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Features.GetLesson;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.UpdateTaskStep;

internal static class UpdateTaskStepHandler
{
    public static async Task<IResult> HandleAsync(
        Guid lessonId, Guid stepId, UpdateTaskStepRequest request, HttpContext httpContext, ContentDbContext db,
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

        var step = await db.LessonSteps
            .FirstOrDefaultAsync(s => s.Id == stepId && s.LessonId == lessonId && s.Type == LessonStepType.Task, cancellationToken);
        if (step is null)
        {
            return Result.Failure<LessonStepDto>(
                Error.NotFound("lesson-step.not-found", "Шаг урока не найден.")).ToApiResult(httpContext);
        }

        var question = await db.Questions.FirstOrDefaultAsync(q => q.LessonStepId == stepId, cancellationToken);
        if (question is null)
        {
            return Result.Failure<LessonStepDto>(
                Error.NotFound("lesson-step.not-found", "Шаг урока не найден.")).ToApiResult(httpContext);
        }

        question.Type = questionType;
        question.Payload = request.Payload.GetRawText();
        question.AnswerKey = request.AnswerKey.GetRawText();

        await db.SaveChangesAsync(cancellationToken);

        var dto = new LessonStepDto(
            step.Id, step.Type.ToString(), step.Position, null,
            new QuestionDto(question.Id, question.Type.ToString(), request.Payload, request.AnswerKey));

        return Result.Success(dto).ToApiResult(httpContext);
    }
}
