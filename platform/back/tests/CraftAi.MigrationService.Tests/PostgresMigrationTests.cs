using CraftAi.MigrationService.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Testcontainers.PostgreSql;

namespace CraftAi.MigrationService.Tests;

/// <summary>
/// То же самое, что <see cref="MigrationWorkerTests"/>, но на настоящем PostgreSQL 16
/// (план 09 §3.1, A0.11) — SQLite достаточно для проверки цикла MigrationWorker, но не
/// доказывает, что миграция реально накатывается провайдером Npgsql. Требует Docker:
/// в песочнице без демона Docker этот класс не выполняется (см. открытый вопрос в
/// сопроводительной сводке к A0), но обязан компилироваться и запускаться там, где
/// Docker есть — включая CI.
/// </summary>
[Trait("Category", "RequiresDocker")]
public sealed class PostgresMigrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine").Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task ExecuteAsync_ПрименяетМиграцииНаНастоящемPostgres()
    {
        var services = new ServiceCollection();
        services.AddDbContext<PostgresTestDbContext>(options => options.UseNpgsql(_postgres.GetConnectionString()));
        await using var provider = services.BuildServiceProvider();

        var fake = new FakeModule("Postgres", typeof(PostgresTestDbContext));
        var lifetime = new NoopApplicationLifetime();
        var worker = new MigrationWorker(
            provider,
            modules: [fake],
            lifetime,
            NullLogger<MigrationWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);
        await lifetime.WaitForStopApplicationAsync(TimeSpan.FromSeconds(30));
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(0, Environment.ExitCode);

        await using var verifyContext = new PostgresTestDbContext(
            new DbContextOptionsBuilder<PostgresTestDbContext>()
                .UseNpgsql(_postgres.GetConnectionString())
                .Options);
        var appliedMigrations = await verifyContext.Database.GetAppliedMigrationsAsync();
        Assert.Contains("InitialCreate", appliedMigrations.Select(m => m.Split('_', 2)[1]));
    }
}
