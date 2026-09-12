using System.Text.Json;
using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Features.AddTaskStep;
using CraftAi.Modules.Content.Features.AddTheoryStep;
using CraftAi.Modules.Content.Features.CreateLesson;
using CraftAi.Modules.Content.Features.CreateSection;
using CraftAi.Modules.Content.Features.DeleteStep;
using CraftAi.Modules.Content.Features.GetLesson;
using CraftAi.Modules.Content.Features.ReorderSteps;
using CraftAi.Modules.Content.Features.UpdateTaskStep;
using CraftAi.Modules.Content.Features.UpdateTheoryStep;
using CraftAi.Modules.Content.Persistence;
using CraftAi.Modules.Content.UnitTests.Fixtures;
using CraftAi.SharedKernel;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace CraftAi.Modules.Content.UnitTests;

/// <summary>
/// Оркестрация обработчиков A3 (план 09 §3.4): нумерация позиций, «сохранение — уже
/// публикация», отказ AddTaskStep без записи при невалидной структуре вопроса.
/// </summary>
public sealed class ContentHandlersTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ContentDbContext _db = null!;
    private FakeTimeProvider _timeProvider = null!;
    private FakeQuestionValidationService _validation = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<ContentDbContext>()
            .UseSqlite(_connection)
            .UseSnakeCaseNamingConvention()
            .Options;
        _db = new ContentDbContext(options);
        await _db.Database.EnsureCreatedAsync();

        _timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        _validation = new FakeQuestionValidationService();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task CreateSection_ВтораяСекцияТойЖеПараллели_ПолучаетСледующуюПозицию()
    {
        await CreateSectionHandler.HandleAsync(
            new CreateSectionRequest("Раздел 1", 7), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);
        var second = await CreateSectionHandler.HandleAsync(
            new CreateSectionRequest("Раздел 2", 7), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);

        var body = Assert.IsType<SectionResponse>(GetOkValue(second));
        Assert.Equal(1, body.Position);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(12)]
    public async Task CreateSection_НевернаяПараллель_Отказ(int grade)
    {
        var result = await CreateSectionHandler.HandleAsync(
            new CreateSectionRequest("Раздел", grade), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
    }

    [Fact]
    public async Task CreateLesson_СохранённыйУрокСразуОпубликован()
    {
        var sectionId = await CreateSectionAsync();

        var response = await CreateLessonHandler.HandleAsync(
            new CreateLessonRequest(sectionId, "Урок 1"), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);

        var lesson = Assert.IsType<LessonResponse>(GetCreatedValue(response));
        Assert.True(lesson.IsPublished);
    }

    [Fact]
    public async Task CreateLesson_НесуществующийРаздел_NotFound()
    {
        var result = await CreateLessonHandler.HandleAsync(
            new CreateLessonRequest(Guid.NewGuid(), "Урок"), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, GetStatusCode(result));
    }

    [Fact]
    public async Task AddTheoryStep_БезМатериалов_Отказ()
    {
        var lessonId = await CreateLessonAsync();

        var result = await AddTheoryStepHandler.HandleAsync(
            lessonId, new AddTheoryStepRequest([]), new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
    }

    [Fact]
    public async Task AddTheoryStep_СМатериалами_СоздаётШагИМатериалы()
    {
        var lessonId = await CreateLessonAsync();

        await AddTheoryStepHandler.HandleAsync(
            lessonId,
            new AddTheoryStepRequest([new MaterialInput("text", "Привет"), new MaterialInput("video", "https://example.com/v.mp4")]),
            new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(1, await _db.LessonSteps.CountAsync());
        Assert.Equal(2, await _db.StepMaterials.CountAsync());
    }

    [Fact]
    public async Task AddTaskStep_ВалидацияПровалилась_НичегоНеЗаписывает()
    {
        var lessonId = await CreateLessonAsync();
        _validation.NextResult = Result.Failure(Error.Validation("question.invalid-structure", "тест"));

        var result = await AddTaskStepHandler.HandleAsync(
            lessonId,
            new AddTaskStepRequest("SingleChoice", Parse("{}"), Parse("{}")),
            new DefaultHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
        Assert.Equal(0, await _db.LessonSteps.CountAsync());
        Assert.Equal(0, await _db.Questions.CountAsync());
    }

    [Fact]
    public async Task AddTaskStep_ВалидацияПрошла_СоздаётШагИВопрос()
    {
        var lessonId = await CreateLessonAsync();
        _validation.NextResult = Result.Success();

        var result = await AddTaskStepHandler.HandleAsync(
            lessonId,
            new AddTaskStepRequest("SingleChoice", Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":0}""")),
            new DefaultHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status201Created, GetStatusCode(result));
        Assert.Equal(1, await _db.LessonSteps.CountAsync());
        Assert.Equal(1, await _db.Questions.CountAsync());
    }

    [Fact]
    public async Task AddTaskStep_НераспознанныйТип_Отказ()
    {
        var lessonId = await CreateLessonAsync();

        var result = await AddTaskStepHandler.HandleAsync(
            lessonId, new AddTaskStepRequest("NotAType", Parse("{}"), Parse("{}")),
            new DefaultHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
    }

    [Fact]
    public async Task UpdateTheoryStep_СМатериалами_ЗаменяетСтарыеМатериалы()
    {
        var lessonId = await CreateLessonAsync();
        var stepId = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "Старый материал"));

        var result = await UpdateTheoryStepHandler.HandleAsync(
            lessonId, stepId,
            new UpdateTheoryStepRequest([new MaterialInput("video", "https://example.com/v.mp4"), new MaterialInput("text", "Новый")]),
            new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status200OK, GetStatusCode(result));
        Assert.Equal(2, await _db.StepMaterials.CountAsync(m => m.LessonStepId == stepId));
        Assert.False(await _db.StepMaterials.AnyAsync(m => m.Content == "Старый материал"));
    }

    [Fact]
    public async Task UpdateTheoryStep_БезМатериалов_Отказ()
    {
        var lessonId = await CreateLessonAsync();
        var stepId = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "Материал"));

        var result = await UpdateTheoryStepHandler.HandleAsync(
            lessonId, stepId, new UpdateTheoryStepRequest([]), new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
    }

    [Fact]
    public async Task UpdateTheoryStep_НесуществующийШаг_NotFound()
    {
        var lessonId = await CreateLessonAsync();

        var result = await UpdateTheoryStepHandler.HandleAsync(
            lessonId, Guid.NewGuid(), new UpdateTheoryStepRequest([new MaterialInput("text", "x")]),
            new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, GetStatusCode(result));
    }

    [Fact]
    public async Task UpdateTaskStep_ВалидацияПровалилась_НичегоНеМеняет()
    {
        var lessonId = await CreateLessonAsync();
        _validation.NextResult = Result.Success();
        var stepId = await AddTaskStepAsync(lessonId, "SingleChoice", Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":0}"""));

        _validation.NextResult = Result.Failure(Error.Validation("question.invalid-structure", "тест"));
        var result = await UpdateTaskStepHandler.HandleAsync(
            lessonId, stepId, new UpdateTaskStepRequest("MultipleChoice", Parse("{}"), Parse("{}")),
            new DefaultHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
        var question = await _db.Questions.SingleAsync(q => q.LessonStepId == stepId);
        Assert.Equal(QuestionType.SingleChoice, question.Type);
    }

    [Fact]
    public async Task UpdateTaskStep_ВалидацияПрошла_ОбновляетВопрос()
    {
        var lessonId = await CreateLessonAsync();
        _validation.NextResult = Result.Success();
        var stepId = await AddTaskStepAsync(lessonId, "SingleChoice", Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":0}"""));

        var result = await UpdateTaskStepHandler.HandleAsync(
            lessonId, stepId,
            new UpdateTaskStepRequest("MultipleChoice", Parse("""{"options":["a","b","c"]}"""), Parse("""{"correctIndices":[0,1]}""")),
            new DefaultHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status200OK, GetStatusCode(result));
        var question = await _db.Questions.SingleAsync(q => q.LessonStepId == stepId);
        Assert.Equal(QuestionType.MultipleChoice, question.Type);
        Assert.Equal(1, await _db.Questions.CountAsync(q => q.LessonStepId == stepId));
    }

    [Fact]
    public async Task UpdateTaskStep_НесуществующийШаг_NotFound()
    {
        var lessonId = await CreateLessonAsync();
        _validation.NextResult = Result.Success();

        var result = await UpdateTaskStepHandler.HandleAsync(
            lessonId, Guid.NewGuid(), new UpdateTaskStepRequest("SingleChoice", Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":0}""")),
            new DefaultHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, GetStatusCode(result));
    }

    [Fact]
    public async Task DeleteStep_УдаляетШагИПеренумеровываетОстальные()
    {
        var lessonId = await CreateLessonAsync();
        var first = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "1"));
        var second = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "2"));
        var third = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "3"));

        var result = await DeleteStepHandler.HandleAsync(lessonId, second, new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status204NoContent, GetStatusCode(result));
        Assert.Equal(2, await _db.LessonSteps.CountAsync(s => s.LessonId == lessonId));
        Assert.Equal(0, (await _db.LessonSteps.SingleAsync(s => s.Id == first)).Position);
        Assert.Equal(1, (await _db.LessonSteps.SingleAsync(s => s.Id == third)).Position);
    }

    [Fact]
    public async Task DeleteStep_НесуществующийШаг_NotFound()
    {
        var lessonId = await CreateLessonAsync();

        var result = await DeleteStepHandler.HandleAsync(lessonId, Guid.NewGuid(), new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, GetStatusCode(result));
    }

    [Fact]
    public async Task ReorderSteps_КорректныйНабор_ПерезаписываетПозиции()
    {
        var lessonId = await CreateLessonAsync();
        var first = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "1"));
        var second = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "2"));
        var third = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "3"));

        var result = await ReorderStepsHandler.HandleAsync(
            lessonId, new ReorderStepsRequest([third, first, second]), new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status204NoContent, GetStatusCode(result));
        Assert.Equal(0, (await _db.LessonSteps.SingleAsync(s => s.Id == third)).Position);
        Assert.Equal(1, (await _db.LessonSteps.SingleAsync(s => s.Id == first)).Position);
        Assert.Equal(2, (await _db.LessonSteps.SingleAsync(s => s.Id == second)).Position);
    }

    [Theory]
    [MemberData(nameof(InvalidReorderCases))]
    public async Task ReorderSteps_НекорректныйНабор_Отказ(Func<Guid, Guid, Guid, IReadOnlyList<Guid>> buildIds)
    {
        var lessonId = await CreateLessonAsync();
        var first = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "1"));
        var second = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "2"));
        var third = await AddTheoryStepAsync(lessonId, new MaterialInput("text", "3"));

        var result = await ReorderStepsHandler.HandleAsync(
            lessonId, new ReorderStepsRequest(buildIds(first, second, third)), new DefaultHttpContext(), _db, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
    }

    public static IEnumerable<object[]> InvalidReorderCases()
    {
        // Пропущен один из шагов.
        yield return new object[] { (Func<Guid, Guid, Guid, IReadOnlyList<Guid>>)((a, b, _) => [a, b]) };
        // Один id повторён вместо третьего.
        yield return new object[] { (Func<Guid, Guid, Guid, IReadOnlyList<Guid>>)((a, b, _) => [a, b, a]) };
        // Чужой id, не принадлежащий уроку.
        yield return new object[] { (Func<Guid, Guid, Guid, IReadOnlyList<Guid>>)((a, b, _) => [a, b, Guid.NewGuid()]) };
    }

    private async Task<Guid> CreateSectionAsync()
    {
        var response = await CreateSectionHandler.HandleAsync(
            new CreateSectionRequest("Раздел", 7), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);
        return ((SectionResponse)GetCreatedValue(response)).Id;
    }

    private async Task<Guid> CreateLessonAsync()
    {
        var sectionId = await CreateSectionAsync();
        var response = await CreateLessonHandler.HandleAsync(
            new CreateLessonRequest(sectionId, "Урок"), new DefaultHttpContext(), _db, _timeProvider, CancellationToken.None);
        return ((LessonResponse)GetCreatedValue(response)).Id;
    }

    private async Task<Guid> AddTheoryStepAsync(Guid lessonId, params MaterialInput[] materials)
    {
        var response = await AddTheoryStepHandler.HandleAsync(
            lessonId, new AddTheoryStepRequest(materials), new DefaultHttpContext(), _db, CancellationToken.None);
        return ((LessonStepDto)GetCreatedValue(response)).Id;
    }

    private async Task<Guid> AddTaskStepAsync(Guid lessonId, string questionType, JsonElement payload, JsonElement answerKey)
    {
        var response = await AddTaskStepHandler.HandleAsync(
            lessonId, new AddTaskStepRequest(questionType, payload, answerKey), new DefaultHttpContext(), _db, _validation, CancellationToken.None);
        return ((LessonStepDto)GetCreatedValue(response)).Id;
    }

    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement;

    // Обработчики возвращают закрытые generic-типы TypedResults (Ok<T>/Created<T>/
    // JsonHttpResult<T>) — доступ только через рефлексию по имени свойства, паттерн
    // по объявленному типу с object в качестве T никогда бы не совпал.
    private static int GetStatusCode(IResult result) =>
        Convert.ToInt32(result.GetType().GetProperty("StatusCode")!.GetValue(result));

    private static object GetOkValue(IResult result) =>
        result.GetType().GetProperty("Value")!.GetValue(result)!;

    private static object GetCreatedValue(IResult result) =>
        result.GetType().GetProperty("Value")!.GetValue(result)!;
}
