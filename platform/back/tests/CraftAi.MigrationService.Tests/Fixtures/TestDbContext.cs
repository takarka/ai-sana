using Microsoft.EntityFrameworkCore;

namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>
/// Проверяет только механику <see cref="MigrationWorker"/> — цикл по типам DbContext
/// и вызов Database.MigrateAsync(). Не имитирует ни один реальный модуль.
/// </summary>
public sealed class TestDbContext(DbContextOptions<TestDbContext> options) : DbContext(options)
{
    public DbSet<TestEntity> Entities => Set<TestEntity>();
}
