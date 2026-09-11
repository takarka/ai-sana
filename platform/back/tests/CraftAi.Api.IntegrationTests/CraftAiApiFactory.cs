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
        // Program.cs читает эти значения через builder.AddRedisDistributedCache и
        // ValidateOnStart(JwtOptions) ДО того, как WebApplicationFactory успевает
        // подставить ConfigureAppConfiguration — переменные окружения читаются
        // WebApplication.CreateBuilder синхронно и раньше, поэтому только так тестовые
        // значения долетают до этих строк. IdentityDbContext в этих тестах не
        // используется (ни один сценарий не бьёт по БД), поэтому строка подключения —
        // синтаксически валидная заглушка, а не реальный Postgres.
        Environment.SetEnvironmentVariable("ConnectionStrings__cache", "localhost:6379,abortConnect=false");
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__craftai", "Host=localhost;Database=unused;Username=postgres;Password=postgres");
        Environment.SetEnvironmentVariable(
            "Jwt__SigningKey", "craftai-api-integrationtests-signing-key-32-plus-chars");
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
