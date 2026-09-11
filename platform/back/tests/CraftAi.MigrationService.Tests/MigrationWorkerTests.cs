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
            modules: [],
            lifetime,
            NullLogger<MigrationWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);
        await lifetime.WaitForStopApplicationAsync(Timeout);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(0, Environment.ExitCode);
        Assert.True(lifetime.StopApplicationCalled);
    }

    [Fact]
    public async Task ExecuteAsync_МодульБезDbContext_ТолькоСидируется()
    {
        var fake = new FakeModule("NoDb");
        var lifetime = new NoopApplicationLifetime();
        var worker = new MigrationWorker(
            new ServiceCollection().BuildServiceProvider(),
            modules: [fake],
            lifetime,
            NullLogger<MigrationWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);
        await lifetime.WaitForStopApplicationAsync(Timeout);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(0, Environment.ExitCode);
        Assert.True(fake.SeedCalled);
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

        var fake = new FakeModule("Test", typeof(TestDbContext));
        var lifetime = new NoopApplicationLifetime();
        var worker = new MigrationWorker(
            provider,
            modules: [fake],
            lifetime,
            NullLogger<MigrationWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);

        // Дожидаемся собственного сигнала воркера о завершении, а не гоняемся с ним через
        // StopAsync: тот отменяет stoppingToken почти сразу и на реальной БД это прервало бы
        // MigrateAsync на середине (см. фикс в MigrationWorker.cs и открытый вопрос О4 плана 09).
        await lifetime.WaitForStopApplicationAsync(Timeout);
        await worker.StopAsync(CancellationToken.None);

        Assert.Equal(0, Environment.ExitCode);
        Assert.True(fake.SeedCalled);

        await using var verifyContext = new TestDbContext(
            new DbContextOptionsBuilder<TestDbContext>().UseSqlite(connection).Options);
        var appliedMigrations = await verifyContext.Database.GetAppliedMigrationsAsync();
        Assert.Contains("InitialCreate", appliedMigrations.Select(m => m.Split('_', 2)[1]));
    }
}
