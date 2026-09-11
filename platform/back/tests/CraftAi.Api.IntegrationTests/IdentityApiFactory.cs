using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

namespace CraftAi.Api.IntegrationTests;

/// <summary>
/// Реальный <c>Program.cs</c> на настоящем PostgreSQL 16 через Testcontainers — план 09
/// §3.2, A1: «интеграционные тесты на реальном Postgres зелёные». Требует Docker; в
/// песочнице без демона Docker этот класс не выполняется (см. сопроводительную сводку),
/// но обязан собираться и работать там, где Docker есть, включая CI.
/// </summary>
public sealed class IdentityApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string SeededSuperAdminEmail = "seed-superadmin@craft-ai.local";
    public const string SeededSuperAdminPassword = "SeedPass123!";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine").Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        // Program.cs читает ConnectionStrings:craftai/Jwt:SigningKey через
        // WebApplication.CreateBuilder ДО того, как ConfigureWebHost успевает подставить
        // конфигурацию (см. CraftAiApiFactory) — только переменные окружения успевают вовремя.
        Environment.SetEnvironmentVariable("ConnectionStrings__craftai", _postgres.GetConnectionString());
        Environment.SetEnvironmentVariable(
            "Jwt__SigningKey", "testcontainers-integration-signing-key-32-plus-chars");
        Environment.SetEnvironmentVariable("ConnectionStrings__cache", "localhost:6379,abortConnect=false");

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        await db.Database.MigrateAsync();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in PlatformRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role) { Id = Guid.NewGuid() });
            }
        }

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = SeededSuperAdminEmail,
            Email = SeededSuperAdminEmail,
            EmailConfirmed = true,
            FullName = "Seed SuperAdmin",
            MustChangePassword = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };
        var createResult = await userManager.CreateAsync(user, SeededSuperAdminPassword);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join("; ", createResult.Errors.Select(e => e.Description)));
        }

        await userManager.AddToRoleAsync(user, PlatformRoles.SuperAdmin);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
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
