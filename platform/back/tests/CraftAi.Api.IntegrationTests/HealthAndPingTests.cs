using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace CraftAi.Api.IntegrationTests;

public sealed class HealthAndPingTests(CraftAiApiFactory factory) : IClassFixture<CraftAiApiFactory>
{
    [Fact]
    public async Task GetHealth_Отвечает200()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAlive_Отвечает200()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/alive");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPing_ВозвращаетStatusOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/ping");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("ok", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Ответ_ВсегдаНесётXRequestId()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/ping");

        Assert.True(response.Headers.Contains("X-Request-Id"));
    }

    [Fact]
    public async Task XRequestId_ПереданныйКлиентом_Эхается()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/ping");
        request.Headers.Add("X-Request-Id", "caller-supplied-id");

        var response = await client.SendAsync(request);

        Assert.Equal("caller-supplied-id", response.Headers.GetValues("X-Request-Id").Single());
    }

    [Fact]
    public async Task GetOpenApiDocument_Возвращает3_1()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.StartsWith("3.1", body.GetProperty("openapi").GetString());
    }
}
