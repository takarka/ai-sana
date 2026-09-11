using CraftAi.MigrationService.Tests.Fixtures;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace CraftAi.MigrationService.Tests;

public sealed class MigrationWorkerTests
{
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);

    [Fact]
    public async Task ExecuteAsync_СПустымСпискомКонтекстов_ЗавершаетсяКодом0()
    {
        var lifetime = new NoopApplicationLifetime();
        var worker = new MigrationWorker(
            new ServiceCollection().BuildServiceProvider(),
            dbContextTypes: [],
            lifetime,
            NullLogger<MigrationWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);
        await lifetime.WaitForStopApplicationAsync(Timeout);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(0, Environment.ExitCode);
        Assert.True(lifetime.StopApplicationCalled);
    }

    [Fact]
    public async Task ExecuteAsync_ПрименяетМиграцииЗарегистрированногоDbContext()
    {
        // SQLite in-memory живёт, пока открыто хотя бы одно соединение — держим его сами.
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<TestDbContext>(options => options.UseSqlite(connection));
        await using var provider = services.BuildServiceProvider();

        var lifetime = new NoopApplicationLifetime();
        var worker = new MigrationWorker(
            provider,
            dbContextTypes: [typeof(TestDbContext)],
            lifetime,
            NullLogger<MigrationWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);

        // Дожидаемся собственного сигнала воркера о завершении, а не гоняемся с ним через
        // StopAsync: тот отменяет stoppingToken почти сразу и на реальной БД это прервало бы
        // MigrateAsync на середине (см. фикс в MigrationWorker.cs и открытый вопрос О4 плана 09).
        await lifetime.WaitForStopApplicationAsync(Timeout);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(0, Environment.ExitCode);

        await using var verifyContext = new TestDbContext(
            new DbContextOptionsBuilder<TestDbContext>().UseSqlite(connection).Options);
        var appliedMigrations = await verifyContext.Database.GetAppliedMigrationsAsync();
        Assert.Contains("InitialCreate", appliedMigrations.Select(m => m.Split('_', 2)[1]));
    }
}
