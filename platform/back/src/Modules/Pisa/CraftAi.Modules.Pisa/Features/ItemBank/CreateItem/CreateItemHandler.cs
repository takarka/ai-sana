using System.Security.Claims;
using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Pisa.Domain;
using CraftAi.Modules.Pisa.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

internal static class CreateItemHandler
{
    public static async Task<IResult> HandleAsync(
        CreateItemRequest request, HttpContext httpContext, PisaDbContext db,
        IQuestionValidationService validation, TimeProvider timeProvider, CancellationToken cancellationToken)
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

        var authorId = Guid.Parse(httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var now = timeProvider.GetUtcNow();

        var item = new Item
        {
            Id = Guid.NewGuid(),
            Stimulus = PisaJson.Serialize(request.Stimulus),
            SearchText = request.Stimulus.Text,
            Direction = metadataResult.Value,
            CognitiveProcess = request.CognitiveProcess.Trim(),
            Context = request.Context.Trim(),
            Level = request.Level,
            ExpectedTimeMinutes = request.ExpectedTimeMinutes,
            GradeRangeMin = request.GradeRangeMin,
            GradeRangeMax = request.GradeRangeMax,
            AuthorId = authorId,
            CreatedAtUtc = now,
        };
        db.Items.Add(item);

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

        return Result.Success(ItemResponseFactory.ToResponse(item, questions))
            .ToApiResult(httpContext, value => Results.Created($"/platform/content/pisa/items/{value.Id}", value));
    }
}
