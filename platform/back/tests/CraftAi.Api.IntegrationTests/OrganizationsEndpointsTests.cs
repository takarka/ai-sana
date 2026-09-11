using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClosedXML.Excel;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// Определение готовности A2 (план 09 §3.3): школа создаётся вместе с учебным годом; класс
/// нельзя создать дважды; импорт файла с намеренно битой строкой возвращает предпросмотр, где
/// эта строка помечена причиной, остальные — годны; повторный импорт того же файла не создаёт
/// дублей; чужая организация недоступна под не-платформенной ролью.
/// </summary>
[Trait("Category", "RequiresDocker")]
public sealed class OrganizationsEndpointsTests(PlatformApiFactory factory) : IClassFixture<PlatformApiFactory>
{
    [Fact]
    public async Task CreateOrganization_ЗаводитШколуВместеСУчебнымГодом()
    {
        var client = await AuthorizedClientAsync();

        var response = await PostJsonAsync(client, "/platform/orgs", new { name = "Школа №1", region = "Алматы" });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.False(string.IsNullOrEmpty(body.GetProperty("academicYearId").GetString()));
        Assert.False(string.IsNullOrEmpty(body.GetProperty("academicYearName").GetString()));
    }

    [Fact]
    public async Task CreateClassGroup_ПовторныйПараллельЛитера_Отдаёт409()
    {
        var client = await AuthorizedClientAsync();
        var orgId = await CreateOrganizationAsync(client);

        var first = await PostJsonAsync(client, $"/platform/orgs/{orgId}/classes", new { grade = 7, letter = "А" });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await PostJsonAsync(client, $"/platform/orgs/{orgId}/classes", new { grade = 7, letter = "а" });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task CreateUserAccount_УченикуБезКласса_Отдаёт422()
    {
        var client = await AuthorizedClientAsync();
        var orgId = await CreateOrganizationAsync(client);

        var response = await PostJsonAsync(client, $"/platform/orgs/{orgId}/users", new { fullName = "Ученик Тестов", role = "student" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task CreateUserAccount_УченикуСКлассом_ВозвращаетЛогинИПароль()
    {
        var client = await AuthorizedClientAsync();
        var orgId = await CreateOrganizationAsync(client);
        var classGroupId = await CreateClassGroupAsync(client, orgId, 8, "Б");

        var response = await PostJsonAsync(
            client, $"/platform/orgs/{orgId}/users", new { fullName = "Ученик Тестов", role = "student", classGroupId });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.False(string.IsNullOrEmpty(body.GetProperty("login").GetString()));
        Assert.False(string.IsNullOrEmpty(body.GetProperty("generatedPassword").GetString()));
    }

    [Fact]
    public async Task Import_БитаяСтрокаВПредпросмотреИПовторныйИмпортБезДублей()
    {
        var client = await AuthorizedClientAsync();
        var orgId = await CreateOrganizationAsync(client);
        await CreateClassGroupAsync(client, orgId, 9, "В");

        var xlsx = BuildWorkbook(
            ["ФИО", "ИИН", "Класс", "Роль"],
            ["Сидоров Пётр Ильич", "990101300111", "9В", "ученик"],
            ["", "990101300222", "9В", "ученик"]);

        var firstPreview = await UploadPreviewAsync(client, orgId, xlsx);
        var firstBody = await firstPreview.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.OK, firstPreview.StatusCode);
        Assert.Equal(1, firstBody.GetProperty("createCount").GetInt32());
        Assert.Equal(1, firstBody.GetProperty("errorCount").GetInt32());

        var rows = firstBody.GetProperty("rows").EnumerateArray().ToList();
        // Строка 2 — первая строка данных ("Сидоров..."), строка 3 — вторая (пустое ФИО).
        var badRow = rows.Single(r => r.GetProperty("rowNumber").GetInt32() == 3);
        Assert.Equal("Error", badRow.GetProperty("outcome").GetString());
        Assert.False(string.IsNullOrEmpty(badRow.GetProperty("reason").GetString()));

        var batchId = firstBody.GetProperty("batchId").GetString();
        var commitResponse = await PostJsonAsync(client, $"/platform/orgs/{orgId}/users/import/{batchId}/commit", new { });
        var commitBody = await commitResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.OK, commitResponse.StatusCode);
        Assert.Equal(1, commitBody.GetProperty("createdCount").GetInt32());

        // Повторный импорт того же файла (FR-CORE-08): строка ИИН 990101300111 уже
        // зафиксирована — второй предпросмотр обязан пометить её как дубль, а не создать снова.
        var secondPreview = await UploadPreviewAsync(client, orgId, xlsx);
        var secondBody = await secondPreview.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, secondBody.GetProperty("createCount").GetInt32());
        var secondRows = secondBody.GetProperty("rows").EnumerateArray().ToList();
        var duplicateRow = secondRows.Single(r => r.GetProperty("rowNumber").GetInt32() == 2);
        Assert.Equal("SkipDuplicate", duplicateRow.GetProperty("outcome").GetString());
    }

    [Fact]
    public async Task ListOrganizations_ПодНеплатформеннойРолью_Отдаёт403()
    {
        var client = factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            email = PlatformApiFactory.SeededNoRoleEmail,
            password = PlatformApiFactory.SeededNoRolePassword,
        });
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var accessToken = loginBody.GetProperty("accessToken").GetString();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/platform/orgs");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<HttpClient> AuthorizedClientAsync()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/auth/login", new
        {
            email = PlatformApiFactory.SeededSuperAdminEmail,
            password = PlatformApiFactory.SeededSuperAdminPassword,
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body.GetProperty("accessToken").GetString());
        return client;
    }

    private static async Task<Guid> CreateOrganizationAsync(HttpClient client)
    {
        var response = await PostJsonAsync(client, "/platform/orgs", new { name = $"Школа {Guid.NewGuid():n}" });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task<Guid> CreateClassGroupAsync(HttpClient client, Guid orgId, int grade, string letter)
    {
        var response = await PostJsonAsync(client, $"/platform/orgs/{orgId}/classes", new { grade, letter });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task<HttpResponseMessage> PostJsonAsync(HttpClient client, string url, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        return await client.SendAsync(request);
    }

    private static async Task<HttpResponseMessage> UploadPreviewAsync(HttpClient client, Guid orgId, byte[] xlsx)
    {
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(xlsx);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        content.Add(fileContent, "file", "students.xlsx");

        return await client.PostAsync($"/platform/orgs/{orgId}/users/import/preview", content);
    }

    private static byte[] BuildWorkbook(string[] headers, params string[][] rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Sheet1");

        for (var col = 0; col < headers.Length; col++)
        {
            sheet.Cell(1, col + 1).Value = headers[col];
        }

        for (var row = 0; row < rows.Length; row++)
        {
            for (var col = 0; col < rows[row].Length; col++)
            {
                sheet.Cell(row + 2, col + 1).Value = rows[row][col];
            }
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
