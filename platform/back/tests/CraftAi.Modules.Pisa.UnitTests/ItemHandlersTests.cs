using System.Security.Claims;
using System.Text.Json;
using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;
using CraftAi.Modules.Pisa.Features.ItemBank.UpdateItem;
using CraftAi.Modules.Pisa.Persistence;
using CraftAi.Modules.Pisa.UnitTests.Fixtures;
using CraftAi.SharedKernel;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace CraftAi.Modules.Pisa.UnitTests;

/// <summary>
/// Оркестрация CreateItem/UpdateItem (план 09 §3.6): автор из claims, отказ валидации
/// вопроса не пишет ничего в БД, UpdateItem заменяет вопросы целиком.
/// </summary>
public sealed class ItemHandlersTests : IAsyncLifetime
{
    private static readonly Guid AuthorId = Guid.NewGuid();

    private SqliteConnection _connection = null!;
    private PisaDbContext _db = null!;
    private FakeTimeProvider _timeProvider = null!;
    private FakeQuestionValidationService _validation = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<PisaDbContext>()
            .UseSqlite(_connection)
            .UseSnakeCaseNamingConvention()
            .Options;
        _db = new PisaDbContext(options);
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
    public async Task CreateItem_ВалидацияПровалилась_НичегоНеЗаписывает()
    {
        _validation.NextResult = Result.Failure(Error.Validation("question.invalid-structure", "тест"));

        var result = await CreateItemHandler.HandleAsync(
            ValidRequest(), AuthorizedHttpContext(), _db, _validation, _timeProvider, CancellationToken.None);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, GetStatusCode(result));
        Assert.Equal(0, await _db.Items.CountAsync());
        Assert.Equal(0, await _db.ItemQuestions.CountAsync());
    }

    [Fact]
    public async Task CreateItem_ВалидацияПрошла_СоздаётЗаданиеСАвторомИзClaims()
    {
        var result = await CreateItemHandler.HandleAsync(
            ValidRequest(), AuthorizedHttpContext(), _db, _validation, _timeProvider, CancellationToken.None);

        Assert.Equal(StatusCodes.Status201Created, GetStatusCode(result));
        var item = Assert.Single(_db.Items);
        Assert.Equal(AuthorId, item.AuthorId);
        Assert.Equal(1, await _db.ItemQuestions.CountAsync());
    }

    [Fact]
    public async Task UpdateItem_ЗаменяетВопросыЦеликом()
    {
        var created = (ItemResponse)GetValue(await CreateItemHandler.HandleAsync(
            ValidRequest(), AuthorizedHttpContext(), _db, _validation, _timeProvider, CancellationToken.None));

        var updateRequest = new UpdateItemRequest(
            new StimulusInput("Обновлённый стимул", null, null),
            "science", "explain", "personal", 4, 20, 6, 9,
            [
                new QuestionInput("ShortText", Parse("{}"), Parse("{}")),
                new QuestionInput("Ordering", Parse("{}"), Parse("{}")),
            ]);

        var result = await UpdateItemHandler.HandleAsync(
            created.Id, updateRequest, AuthorizedHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status200OK, GetStatusCode(result));
        var remainingQuestions = await _db.ItemQuestions.Where(q => q.ItemId == created.Id).ToListAsync();
        Assert.Equal(2, remainingQuestions.Count);
    }

    [Fact]
    public async Task UpdateItem_НесуществующееЗадание_NotFound()
    {
        var result = await UpdateItemHandler.HandleAsync(
            Guid.NewGuid(),
            new UpdateItemRequest(new StimulusInput("x", null, null), "math", "a", "b", 1, 5, 1, 2, [new QuestionInput("ShortText", Parse("{}"), Parse("{}"))]),
            AuthorizedHttpContext(), _db, _validation, CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, GetStatusCode(result));
    }

    private static CreateItemRequest ValidRequest() => new(
        new StimulusInput("Стимул задания", null, null),
        "math", "formulate", "personal", 3, 15, 5, 7,
        [new QuestionInput("SingleChoice", Parse("""{"options":["a","b"]}"""), Parse("""{"correctIndex":0}"""))]);

    private static HttpContext AuthorizedHttpContext()
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, AuthorId.ToString())], authenticationType: "Test"));
        return context;
    }

    private static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement;

    private static int GetStatusCode(IResult result) =>
        Convert.ToInt32(result.GetType().GetProperty("StatusCode")!.GetValue(result));

    private static object GetValue(IResult result) => result.GetType().GetProperty("Value")!.GetValue(result)!;
}
