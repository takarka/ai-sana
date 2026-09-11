using System.Text.Json;
using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;
using CraftAi.Modules.Pisa.UnitTests.Fixtures;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Pisa.UnitTests;

public sealed class QuestionInputsValidatorTests
{
    [Fact]
    public void Validate_ОдинКорректныйВопрос_Успех()
    {
        var validation = new FakeQuestionValidationService();
        var questions = new[] { new QuestionInput("SingleChoice", Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":0}""")) };

        var result = QuestionInputsValidator.Validate(questions, validation);

        Assert.True(result.IsSuccess);
        Assert.Equal(QuestionType.SingleChoice, result.Value[0].Type);
    }

    [Fact]
    public void Validate_НераспознанныйТип_Отказ()
    {
        var validation = new FakeQuestionValidationService();
        var questions = new[] { new QuestionInput("NotAType", Parse("{}"), Parse("{}")) };

        var result = QuestionInputsValidator.Validate(questions, validation);

        Assert.True(result.IsFailure);
        Assert.Equal("item.invalid-question-type", result.Error!.Code);
    }

    [Fact]
    public void Validate_ОтказВалидацииВторогоВопроса_УказываетНомерСтроки()
    {
        var validation = new FakeQuestionValidationService
        {
            NextResult = Result.Failure(Error.Validation("question.invalid-structure", "причина")),
        };
        var questions = new[]
        {
            new QuestionInput("SingleChoice", Parse("{}"), Parse("{}")),
            new QuestionInput("ShortText", Parse("{}"), Parse("{}")),
        };

        var result = QuestionInputsValidator.Validate(questions, validation);

        Assert.True(result.IsFailure);
        Assert.Contains("Вопрос 1", result.Error!.Message);
    }

    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement;
}
