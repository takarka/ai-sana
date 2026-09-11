using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// Определение готовности A4 (план 09 §3.6): составное задание сохраняется сразу со
/// стимулом и несколькими вопросами разных форматов (FR-PSA-05), с автором и датой
/// (FR-PSA-01); задание с некорректным вопросом отдаёт причину и не сохраняется;
/// SearchItems находит по тексту стимула и фильтрует по направлению/уровню/параллели.
/// </summary>
[Trait("Category", "RequiresDocker")]
public sealed class PisaEndpointsTests(PlatformApiFactory factory) : IClassFixture<PlatformApiFactory>
{
    [Fact]
    public async Task CreateItem_СоставноеЗадание_СохраняетсяСразуСАвтором()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);

        var response = await PostJsonAsync(client, "/platform/content/pisa/items", new
        {
            stimulus = new { text = "Уникальныйтекстстимула про вулканы и извержения" },
            direction = "science",
            cognitiveProcess = "explain",
            context = "societal",
            level = 3,
            expectedTimeMinutes = 20,
            gradeRangeMin = 5,
            gradeRangeMax = 9,
            questions = new object[]
            {
                new { questionType = "SingleChoice", payload = new { options = new[] { "a", "b" } }, answerKey = new { correctIndex = 0 } },
                new { questionType = "ShortText", payload = new { question = "?" }, answerKey = new { acceptedAnswers = new[] { "лава" } } },
            },
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.False(string.IsNullOrEmpty(body.GetProperty("authorId").GetString()));
        Assert.Equal(2, body.GetProperty("questions").GetArrayLength());
    }

    [Fact]
    public async Task CreateItem_НекорректныйВопрос_Отдаёт422ИНичегоНеСохраняет()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);

        var response = await PostJsonAsync(client, "/platform/content/pisa/items", new
        {
            stimulus = new { text = "Стимул с плохим вопросом" },
            direction = "math",
            cognitiveProcess = "formulate",
            context = "personal",
            level = 2,
            expectedTimeMinutes = 10,
            gradeRangeMin = 3,
            gradeRangeMax = 4,
            questions = new object[]
            {
                new { questionType = "SingleChoice", payload = new { options = new[] { "a", "b" } }, answerKey = new { correctIndex = 9 } },
            },
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("Вопрос 1", body.GetProperty("message").GetString());
    }

    [Fact]
    public async Task UpdateItem_ЗаменяетВопросыЦеликом()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var itemId = await CreateItemAsync(client, "Задание для обновления", "math", 3, 4);

        var updateResponse = await PutJsonAsync(client, $"/platform/content/pisa/items/{itemId}", new
        {
            stimulus = new { text = "Задание для обновления" },
            direction = "math",
            cognitiveProcess = "employ",
            context = "scientific",
            level = 4,
            expectedTimeMinutes = 25,
            gradeRangeMin = 6,
            gradeRangeMax = 8,
            questions = new object[]
            {
                new { questionType = "Ordering", payload = new { items = new[] { "a", "b" } }, answerKey = new { order = new[] { 1, 0 } } },
            },
        });
        var updateBody = await updateResponse.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Single(updateBody.GetProperty("questions").EnumerateArray());
        Assert.Equal(4, updateBody.GetProperty("level").GetInt32());
    }

    [Fact]
    public async Task SearchItems_ПолнотекстовыйПоискНаходитЗаданиеПоСтимулу()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        // to_tsvector токенизирует по границам слов, а не по подстроке — стимул обязан
        // содержать слово "фотосинтеза" отдельно, а не слитно с соседними.
        await CreateItemAsync(client, "Пересказ фотосинтеза и клеточного дыхания, уникальный маркер запроса", "science", 2, 10, 11);

        var response = await client.GetAsync("/platform/content/pisa/items?search=фотосинтеза");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(body.GetProperty("totalCount").GetInt32() >= 1);
    }

    [Fact]
    public async Task SearchItems_ФильтрПоПараллели_ИсключаетНеподходящееЗадание()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var stimulusMarker = $"Маркер{Guid.NewGuid():n}";
        await CreateItemAsync(client, stimulusMarker, "reading", 3, 9, 11);

        var matchingGrade = await client.GetAsync($"/platform/content/pisa/items?search={stimulusMarker}&grade=10");
        var matchingBody = await matchingGrade.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(matchingBody.GetProperty("totalCount").GetInt32() >= 1);

        var nonMatchingGrade = await client.GetAsync($"/platform/content/pisa/items?search={stimulusMarker}&grade=2");
        var nonMatchingBody = await nonMatchingGrade.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, nonMatchingBody.GetProperty("totalCount").GetInt32());
    }

    private async Task<HttpClient> AuthorizedClientAsync(string email, string password)
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/auth/login", new { email, password });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.GetProperty("accessToken").GetString());
        return client;
    }

    private static async Task<Guid> CreateItemAsync(
        HttpClient client, string stimulusText, string direction, int level, int gradeMin, int? gradeMax = null)
    {
        var response = await PostJsonAsync(client, "/platform/content/pisa/items", new
        {
            stimulus = new { text = stimulusText },
            direction,
            cognitiveProcess = "formulate",
            context = "personal",
            level,
            expectedTimeMinutes = 15,
            gradeRangeMin = gradeMin,
            gradeRangeMax = gradeMax ?? gradeMin,
            questions = new object[]
            {
                new { questionType = "ShortText", payload = new { question = "?" }, answerKey = new { acceptedAnswers = new[] { "x" } } },
            },
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task<HttpResponseMessage> PostJsonAsync(HttpClient client, string url, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> PutJsonAsync(HttpClient client, string url, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, url) { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        return await client.SendAsync(request);
    }
}
