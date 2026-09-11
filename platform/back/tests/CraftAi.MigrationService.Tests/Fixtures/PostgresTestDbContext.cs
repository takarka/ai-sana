using Microsoft.EntityFrameworkCore;

namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>
/// Тот же смысл, что у <see cref="TestDbContext"/>, но с провайдером Npgsql: миграции,
/// сгенерированные под SQLite, на Postgres не накатываются (разные диалекты и аннотации
/// модели), поэтому для проверки MigrationWorker на настоящем Postgres нужен свой контекст
/// со своими миграциями (Fixtures/PostgresMigrations).
/// </summary>
public sealed class PostgresTestDbContext(DbContextOptions<PostgresTestDbContext> options) : DbContext(options)
{
    public DbSet<TestEntity> Entities => Set<TestEntity>();
}
