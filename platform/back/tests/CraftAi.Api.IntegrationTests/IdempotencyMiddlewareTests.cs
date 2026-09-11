using System.Net;
using System.Net.Http.Json;
using CraftAi.Api.Http.Idempotency;
using CraftAi.Api.Http.RequestId;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// IdempotencyMiddleware проверяется на отдельном тестовом хосте с одним POST-эндпоинтом:
/// в продукте такого маршрута нет (первый появится в A1), но сама middleware — часть A0.8
/// и должна быть доказана сейчас, а не отложена до первого реального POST.
/// </summary>
public sealed class IdempotencyMiddlewareTests : IAsyncLifetime
{
    private WebApplication _app = null!;
    private HttpClient _client = null!;
    private int _handlerInvocations;

    public async Task InitializeAsync()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddDistributedMemoryCache();
        builder.Logging.ClearProviders();

        _app = builder.Build();
        _app.UseMiddleware<RequestIdMiddleware>();
        _app.UseMiddleware<IdempotencyMiddleware>();

        _app.MapPost("/test", () =>
        {
            Interlocked.Increment(ref _handlerInvocations);
            return Results.Ok(new { invocations = _handlerInvocations });
        }).RequireIdempotencyKey();

        _app.MapPost("/test/not-idempotent", () => Results.Ok());

        await _app.StartAsync();
        _client = _app.GetTestServer().CreateClient();
    }

    public async Task DisposeAsync() => await _app.StopAsync();

    [Fact]
    public async Task БезЗаголовка_Отдаёт400()
    {
        var response = await _client.PostAsJsonAsync("/test", new { value = 1 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ЭндпоинтБезМетки_НеТребуетЗаголовок()
    {
        var response = await _client.PostAsJsonAsync("/test/not-idempotent", new { value = 1 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ПовторСТемЖеКлючомИТелом_ОтдаётЗакэшированныйОтветБезПовторногоВызова()
    {
        using var first = NewRequest("same-key", new { value = 1 });
        var firstResponse = await _client.SendAsync(first);
        var firstBody = await firstResponse.Content.ReadFromJsonAsync<InvocationsBody>();

        using var second = NewRequest("same-key", new { value = 1 });
        var secondResponse = await _client.SendAsync(second);
        var secondBody = await secondResponse.Content.ReadFromJsonAsync<InvocationsBody>();

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);
        Assert.Equal(1, firstBody!.Invocations);
        Assert.Equal(1, secondBody!.Invocations);
        Assert.Equal(1, _handlerInvocations);
    }

    [Fact]
    public async Task ПовторСТемЖеКлючомНоДругимТелом_Отдаёт409()
    {
        using var first = NewRequest("conflict-key", new { value = 1 });
        await _client.SendAsync(first);

        using var second = NewRequest("conflict-key", new { value = 2 });
        var secondResponse = await _client.SendAsync(second);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    private static HttpRequestMessage NewRequest(string idempotencyKey, object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/test")
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Add("Idempotency-Key", idempotencyKey);
        return request;
    }

    private sealed record InvocationsBody(int Invocations);
}
