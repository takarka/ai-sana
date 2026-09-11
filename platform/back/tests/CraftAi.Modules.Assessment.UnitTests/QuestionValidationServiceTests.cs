using System.Text.Json;
using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Assessment.Validation;

namespace CraftAi.Modules.Assessment.UnitTests;

/// <summary>
/// Структурная валидация восьми типов вопросов (план 09 §3.5, О2) — самая рискованная
/// логика A3: любой пропуск здесь пускает в БД задание, которое `Learning` не сможет
/// проверить, когда до него дойдёт очередь.
/// </summary>
public sealed class QuestionValidationServiceTests
{
    private readonly QuestionValidationService _sut = new();

    [Theory]
    [InlineData(QuestionType.SingleChoice, """{"options":["2","4","6","8"]}""", """{"correctIndex":1}""")]
    [InlineData(QuestionType.MultipleChoice, """{"options":["2","4","6","8"]}""", """{"correctIndices":[0,2]}""")]
    [InlineData(QuestionType.Matching, """{"left":["A","B"],"right":["1","2"]}""", """{"pairs":[[0,1],[1,0]]}""")]
    [InlineData(QuestionType.Ordering, """{"items":["a","b","c"]}""", """{"order":[2,0,1]}""")]
    [InlineData(QuestionType.FillInBlank, """{"text":"2+2=___"}""", """{"blanks":["4"]}""")]
    [InlineData(QuestionType.NumericTolerance, """{"question":"Чему равно пи?"}""", """{"expected":3.14,"tolerance":0.01}""")]
    [InlineData(QuestionType.ShortText, """{"question":"Столица Казахстана?"}""", """{"acceptedAnswers":["Астана"]}""")]
    [InlineData(QuestionType.DragAndDrop, """{"items":["кот","пёс"],"categories":["дикие","домашние"]}""", """{"assignments":[[0,1],[1,1]]}""")]
    public void Validate_КорректнаяСтруктура_Успех(QuestionType type, string payloadJson, string answerKeyJson)
    {
        var result = _sut.Validate(type, Parse(payloadJson), Parse(answerKeyJson));

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Validate_SingleChoice_ИндексВнеДиапазона_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.SingleChoice, Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":5}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_MultipleChoice_ПовторяющиесяИндексы_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.MultipleChoice, Parse("""{"options":["a","b","c"]}"""), Parse("""{"correctIndices":[0,0]}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_Matching_НеПокрываетКаждыйLeft_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.Matching,
            Parse("""{"left":["A","B"],"right":["1","2"]}"""),
            Parse("""{"pairs":[[0,1]]}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_Ordering_НеПерестановка_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.Ordering, Parse("""{"items":["a","b","c"]}"""), Parse("""{"order":[0,0,2]}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_NumericTolerance_ОтрицательныйДопуск_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.NumericTolerance, Parse("""{"question":"?"}"""), Parse("""{"expected":1,"tolerance":-1}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_ShortText_ПустойСписокЭталонов_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.ShortText, Parse("""{"question":"?"}"""), Parse("""{"acceptedAnswers":[]}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_DragAndDrop_КатегорияВнеДиапазона_Ошибка()
    {
        var result = _sut.Validate(
            QuestionType.DragAndDrop,
            Parse("""{"items":["a"],"categories":["x","y"]}"""),
            Parse("""{"assignments":[[0,9]]}"""));

        Assert.True(result.IsFailure);
    }

    [Fact]
    public void Validate_ОтсутствуетОбязательноеПоле_Ошибка()
    {
        var result = _sut.Validate(QuestionType.SingleChoice, Parse("""{"options":["a","b"]}"""), Parse("{}"));

        Assert.True(result.IsFailure);
        Assert.Equal("question.invalid-structure", result.Error!.Code);
    }

    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement;
}
