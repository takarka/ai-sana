using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Pisa.Domain;
using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;
using CraftAi.Modules.Pisa.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Pisa.Features.ItemBank.UpdateItem;

internal static class UpdateItemHandler
{
    public static async Task<IResult> HandleAsync(
        Guid itemId, UpdateItemRequest request, HttpContext httpContext, PisaDbContext db,
        IQuestionValidationService validation, CancellationToken cancellationToken)
    {
        var metadataResult = ItemRequestValidator.Validate(
            request.Stimulus.Text, request.Direction, request.Level, request.ExpectedTimeMinutes,
            request.GradeRangeMin, request.GradeRangeMax, request.Questions.Count);
        if (metadataResult.IsFailure)
        {
            return Result.Failure<ItemResponse>(metadataResult.Error!).ToApiResult(httpContext);
        }

        var questionsResult = QuestionInputsValidator.Validate(request.Questions, validation);
        if (questionsResult.IsFailure)
        {
            return Result.Failure<ItemResponse>(questionsResult.Error!).ToApiResult(httpContext);
        }

        var item = await db.Items.FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
        if (item is null)
        {
            return Result.Failure<ItemResponse>(
                Error.NotFound("item.not-found", "Задание не найдено.")).ToApiResult(httpContext);
        }

        item.Stimulus = PisaJson.Serialize(request.Stimulus);
        item.SearchText = request.Stimulus.Text;
        item.Direction = metadataResult.Value;
        item.CognitiveProcess = request.CognitiveProcess.Trim();
        item.Context = request.Context.Trim();
        item.Level = request.Level;
        item.ExpectedTimeMinutes = request.ExpectedTimeMinutes;
        item.GradeRangeMin = request.GradeRangeMin;
        item.GradeRangeMax = request.GradeRangeMax;

        var existingQuestions = await db.ItemQuestions.Where(q => q.ItemId == itemId).ToListAsync(cancellationToken);
        db.ItemQuestions.RemoveRange(existingQuestions);

        var questions = questionsResult.Value.Select((q, index) => new ItemQuestion
        {
            Id = Guid.NewGuid(),
            ItemId = item.Id,
            Position = index,
            Type = q.Type,
            Payload = q.Payload.GetRawText(),
            AnswerKey = q.AnswerKey.GetRawText(),
        }).ToList();
        db.ItemQuestions.AddRange(questions);

        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(ItemResponseFactory.ToResponse(item, questions)).ToApiResult(httpContext);
    }
}
