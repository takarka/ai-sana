using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace CraftAi.Api.IntegrationTests;

[Trait("Category", "RequiresDocker")]
[Collection("Platform API")]
public sealed class IdentityEndpointsTests(PlatformApiFactory factory)
{
    [Fact]
    public async Task Login_СНеправильнымПаролем_Отдаёт401()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/auth/login", new
        {
            email = PlatformApiFactory.SeededSuperAdminEmail,
            password = "wrong-password",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_СПравильнымПаролем_ВозвращаетПаруТоkенов()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/auth/login", new
        {
            email = PlatformApiFactory.SeededSuperAdminEmail,
            password = PlatformApiFactory.SeededSuperAdminPassword,
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(body.GetProperty("mustChangePassword").GetBoolean());
        Assert.Equal("superadmin", body.GetProperty("roles")[0].GetString());
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies!, c => c.StartsWith("refresh_token=", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Me_БезТокена_Отдаёт401()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_СТокеном_ОтдаётРоли()
    {
        var client = factory.CreateClient();
        var accessToken = await LoginAndGetAccessTokenAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/me");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        var response = await client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("superadmin", body.GetProperty("roles")[0].GetString());
    }

    [Fact]
    public async Task Refresh_РотируетИГаситПредыдущийТокен()
    {
        var client = factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/auth/login", new
        {
            email = PlatformApiFactory.SeededSuperAdminEmail,
            password = PlatformApiFactory.SeededSuperAdminPassword,
        });
        var refreshCookie = ExtractRefreshCookie(loginResponse);

        using var firstRefresh = new HttpRequestMessage(HttpMethod.Post, "/auth/refresh");
        firstRefresh.Headers.Add("Cookie", refreshCookie);
        var firstResponse = await client.SendAsync(firstRefresh);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        // Повтор того же (уже отозванного ротацией) refresh-токена — угон.
        using var reuse = new HttpRequestMessage(HttpMethod.Post, "/auth/refresh");
        reuse.Headers.Add("Cookie", refreshCookie);
        var reuseResponse = await client.SendAsync(reuse);

        Assert.Equal(HttpStatusCode.Unauthorized, reuseResponse.StatusCode);
        var body = await reuseResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("refresh.reuse-detected", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ChangePassword_БезIdempotencyKey_Отдаёт400()
    {
        var client = factory.CreateClient();
        var accessToken = await LoginAndGetAccessTokenAsync(client);

        // Проверяем только отказ до какого-либо изменения — не совершаем реальную смену
        // пароля, иначе следующие тесты этого файла (тот же посев БД) сломаются.
        using var request = new HttpRequestMessage(HttpMethod.Post, "/auth/change-password")
        {
            Content = JsonContent.Create(new { currentPassword = "x", newPassword = "y" }),
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task<string> LoginAndGetAccessTokenAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/auth/login", new
        {
            email = PlatformApiFactory.SeededSuperAdminEmail,
            password = PlatformApiFactory.SeededSuperAdminPassword,
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("accessToken").GetString()!;
    }

    private static string ExtractRefreshCookie(HttpResponseMessage response)
    {
        var setCookie = response.Headers.GetValues("Set-Cookie")
            .Single(c => c.StartsWith("refresh_token=", StringComparison.Ordinal));
        return setCookie[..setCookie.IndexOf(';')];
    }
}
