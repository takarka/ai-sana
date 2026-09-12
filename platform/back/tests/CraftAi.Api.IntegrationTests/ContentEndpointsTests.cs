using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// Определение готовности A3 (план 09 §3.4/§3.5): раздел и урок создаются и урок сразу
/// опубликован; задание закрытого типа с некорректной структурой не сохраняется и
/// возвращает причину; методисту (<c>author</c>) доступен контур контента, но не
/// <c>/platform/orgs/**</c> (план 08 §2).
/// </summary>
[Trait("Category", "RequiresDocker")]
[Collection("Platform API")]
public sealed class ContentEndpointsTests(PlatformApiFactory factory)
{
    [Fact]
    public async Task CreateLesson_СохранённыйУрокСразуОпубликован()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var sectionId = await CreateSectionAsync(client);

        var response = await PostJsonAsync(client, "/platform/content/matrix/lessons", new { sectionId, title = "Урок 1" });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.True(body.GetProperty("isPublished").GetBoolean());
    }

    [Fact]
    public async Task AddTaskStep_НекорректнаяСтруктура_Отдаёт422СПричиной()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var response = await PostJsonAsync(
            client,
            $"/platform/content/matrix/lessons/{lessonId}/steps/task",
            new { questionType = "SingleChoice", payload = new { options = new[] { "a", "b" } }, answerKey = new { correctIndex = 9 } });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("question.invalid-structure", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(body.GetProperty("message").GetString()));
    }

    [Fact]
    public async Task AddTaskStep_КорректнаяСтруктура_ПоявляетсяВGetLesson()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var addResponse = await PostJsonAsync(
            client,
            $"/platform/content/matrix/lessons/{lessonId}/steps/task",
            new { questionType = "SingleChoice", payload = new { options = new[] { "2", "4" } }, answerKey = new { correctIndex = 1 } });
        Assert.Equal(HttpStatusCode.Created, addResponse.StatusCode);

        var lessonResponse = await client.GetAsync($"/platform/content/matrix/lessons/{lessonId}");
        var lessonBody = await lessonResponse.Content.ReadFromJsonAsync<JsonElement>();
        var steps = lessonBody.GetProperty("steps").EnumerateArray().ToList();

        Assert.Single(steps);
        Assert.Equal("Task", steps[0].GetProperty("type").GetString());
        Assert.Equal(1, steps[0].GetProperty("question").GetProperty("answerKey").GetProperty("correctIndex").GetInt32());
    }

    [Fact]
    public async Task AddTheoryStep_СМатериалами_ПоявляетсяВGetLesson()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var response = await PostJsonAsync(
            client,
            $"/platform/content/matrix/lessons/{lessonId}/steps/theory",
            new { materials = new[] { new { type = "text", content = "Привет, мир" } } });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var lessonResponse = await client.GetAsync($"/platform/content/matrix/lessons/{lessonId}");
        var lessonBody = await lessonResponse.Content.ReadFromJsonAsync<JsonElement>();
        var materials = lessonBody.GetProperty("steps")[0].GetProperty("materials").EnumerateArray().ToList();

        Assert.Single(materials);
        Assert.Equal("Привет, мир", materials[0].GetProperty("content").GetString());
    }

    [Fact]
    public async Task UpdateTheoryStep_НовыеМатериалы_ЗаменяютСтарыеВGetLesson()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var addResponse = await PostJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/theory",
            new { materials = new[] { new { type = "text", content = "Старый" } } });
        var addBody = await addResponse.Content.ReadFromJsonAsync<JsonElement>();
        var stepId = addBody.GetProperty("id").GetGuid();

        var updateResponse = await PutJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/{stepId}/theory",
            new { materials = new[] { new { type = "video", content = "https://example.com/v.mp4" } } });
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var lessonResponse = await client.GetAsync($"/platform/content/matrix/lessons/{lessonId}");
        var lessonBody = await lessonResponse.Content.ReadFromJsonAsync<JsonElement>();
        var materials = lessonBody.GetProperty("steps")[0].GetProperty("materials").EnumerateArray().ToList();

        Assert.Single(materials);
        Assert.Equal("Video", materials[0].GetProperty("type").GetString());
    }

    [Fact]
    public async Task UpdateTaskStep_НекорректнаяСтруктура_НичегоНеМеняетВGetLesson()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var addResponse = await PostJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/task",
            new { questionType = "SingleChoice", payload = new { options = new[] { "2", "4" } }, answerKey = new { correctIndex = 1 } });
        var addBody = await addResponse.Content.ReadFromJsonAsync<JsonElement>();
        var stepId = addBody.GetProperty("id").GetGuid();

        var updateResponse = await PutJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/{stepId}/task",
            new { questionType = "SingleChoice", payload = new { options = new[] { "2", "4" } }, answerKey = new { correctIndex = 9 } });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, updateResponse.StatusCode);

        var lessonResponse = await client.GetAsync($"/platform/content/matrix/lessons/{lessonId}");
        var lessonBody = await lessonResponse.Content.ReadFromJsonAsync<JsonElement>();
        var question = lessonBody.GetProperty("steps")[0].GetProperty("question");
        Assert.Equal(1, question.GetProperty("answerKey").GetProperty("correctIndex").GetInt32());
    }

    [Fact]
    public async Task DeleteStep_УдаляетШагИзGetLesson()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var addResponse = await PostJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/theory",
            new { materials = new[] { new { type = "text", content = "Материал" } } });
        var addBody = await addResponse.Content.ReadFromJsonAsync<JsonElement>();
        var stepId = addBody.GetProperty("id").GetGuid();

        var deleteResponse = await DeleteAsync(client, $"/platform/content/matrix/lessons/{lessonId}/steps/{stepId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var lessonResponse = await client.GetAsync($"/platform/content/matrix/lessons/{lessonId}");
        var lessonBody = await lessonResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Empty(lessonBody.GetProperty("steps").EnumerateArray());
    }

    [Fact]
    public async Task ReorderSteps_НеполныйНабор_Отдаёт422()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var lessonId = await CreateLessonAsync(client);

        var firstResponse = await PostJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/theory",
            new { materials = new[] { new { type = "text", content = "1" } } });
        var firstId = (await firstResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        await PostJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/theory",
            new { materials = new[] { new { type = "text", content = "2" } } });

        var reorderResponse = await PutJsonAsync(
            client, $"/platform/content/matrix/lessons/{lessonId}/steps/reorder", new { stepIds = new[] { firstId } });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, reorderResponse.StatusCode);
    }

    [Fact]
    public async Task Методист_ДоступенКонтентНоНеОрганизации()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededAuthorEmail, PlatformApiFactory.SeededAuthorPassword);

        var sectionsResponse = await client.GetAsync("/platform/content/matrix/sections");
        Assert.Equal(HttpStatusCode.OK, sectionsResponse.StatusCode);

        var orgsResponse = await client.GetAsync("/platform/orgs");
        Assert.Equal(HttpStatusCode.Forbidden, orgsResponse.StatusCode);
    }

    [Fact]
    public async Task БезПлатформеннойРоли_КонтентНедоступен403()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededNoRoleEmail, PlatformApiFactory.SeededNoRolePassword);

        var response = await client.GetAsync("/platform/content/matrix/sections");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
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

    private static async Task<Guid> CreateSectionAsync(HttpClient client)
    {
        var response = await PostJsonAsync(client, "/platform/content/matrix/sections", new { name = $"Раздел {Guid.NewGuid():n}", grade = 7 });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private async Task<Guid> CreateLessonAsync(HttpClient client)
    {
        var sectionId = await CreateSectionAsync(client);
        var response = await PostJsonAsync(client, "/platform/content/matrix/lessons", new { sectionId, title = "Урок" });
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

    private static async Task<HttpResponseMessage> DeleteAsync(HttpClient client, string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        return await client.SendAsync(request);
    }
}
