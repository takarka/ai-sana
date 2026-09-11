using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// Управление учётками методистов платформы (план 08 §2: «Создать/импортировать учётные
/// записи» — только <c>superadmin</c>). Заводит методиста с синтетическим логином и разовым
/// паролем, как учителя/учеников (план 09 §3.3), но без организации-контекста — роль
/// <c>author</c> назначается напрямую в Identity.
/// </summary>
[Trait("Category", "RequiresDocker")]
[Collection("Platform API")]
public sealed class AuthorAccountsEndpointsTests(PlatformApiFactory factory)
{
    [Fact]
    public async Task CreateAuthorAccount_ВозвращаетЛогинИПарольИНазначаетРольAuthor()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);

        var response = await PostJsonAsync(client, "/platform/authors", new { fullName = "Методист Тестов" });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.False(string.IsNullOrEmpty(body.GetProperty("login").GetString()));
        Assert.False(string.IsNullOrEmpty(body.GetProperty("generatedPassword").GetString()));

        var loginResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            email = body.GetProperty("login").GetString(),
            password = body.GetProperty("generatedPassword").GetString(),
        });
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var roles = loginBody.GetProperty("roles").EnumerateArray().Select(r => r.GetString()).ToList();
        Assert.Contains("author", roles);
    }

    [Fact]
    public async Task CreateAuthorAccount_ПустоеФио_Отдаёт422()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);

        var response = await PostJsonAsync(client, "/platform/authors", new { fullName = "" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task ListAuthorAccounts_СозданныйМетодистПопадаетВСписок()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededSuperAdminEmail, PlatformApiFactory.SeededSuperAdminPassword);
        var createResponse = await PostJsonAsync(client, "/platform/authors", new { fullName = "Методист Списочный" });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();

        var response = await client.GetAsync("/platform/authors");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = body.EnumerateArray().ToList();
        Assert.Contains(items, item => item.GetProperty("userId").GetGuid() == created.GetProperty("userId").GetGuid());
    }

    [Fact]
    public async Task CreateAuthorAccount_ПодРольюAuthor_Отдаёт403()
    {
        var client = await AuthorizedClientAsync(PlatformApiFactory.SeededAuthorEmail, PlatformApiFactory.SeededAuthorPassword);

        var response = await PostJsonAsync(client, "/platform/authors", new { fullName = "Ещё Один Методист" });

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

    private static async Task<HttpResponseMessage> PostJsonAsync(HttpClient client, string url, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        return await client.SendAsync(request);
    }
}
