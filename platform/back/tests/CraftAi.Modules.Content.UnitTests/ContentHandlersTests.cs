using System.Text.Json;
using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Features.AddTaskStep;
using CraftAi.Modules.Content.Features.AddTheoryStep;
using CraftAi.Modules.Content.Features.CreateLesson;
using CraftAi.Modules.Content.Features.CreateSection;
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
