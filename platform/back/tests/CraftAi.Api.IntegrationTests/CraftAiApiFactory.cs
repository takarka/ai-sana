using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// Реальный <c>Program.cs</c> целиком. <see cref="IDistributedCache"/> подменён на in-memory
/// (кэш ответов Idempotency-Key тестами не проверяется — для этого отдельный
/// <see cref="IdempotencyMiddlewareTests"/> на изолированном хосте), но health-check Redis,
/// который регистрирует builder.AddRedisDistributedCache, остаётся настоящим: нужен реально
/// слушающий Redis на localhost:6379 (как в докере/Aspire локально, так и сервис-контейнером
/// в CI, план 09 §6) — иначе GetHealth_Отвечает200 закономерно увидит 503.
/// </summary>
public sealed class CraftAiApiFactory : WebApplicationFactory<Program>
{
    public CraftAiApiFactory()
    {
        // Program.cs читает ConnectionStrings:cache через builder.AddRedisDistributedCache
        // ДО того, как WebApplicationFactory успевает подставить ConfigureAppConfiguration —
        // переменная окружения читается WebApplication.CreateBuilder синхронно и раньше,
        // поэтому только так тестовое значение долетает до этой конкретной строки.
        Environment.SetEnvironmentVariable("ConnectionStrings__cache", "localhost:6379,abortConnect=false");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IDistributedCache>();
            services.AddDistributedMemoryCache();
        });
    }
}
