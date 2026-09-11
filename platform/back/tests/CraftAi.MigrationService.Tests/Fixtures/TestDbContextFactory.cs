using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>Design-time фабрика для `dotnet ef migrations add` — рантайму не нужна.</summary>
public sealed class TestDbContextFactory : IDesignTimeDbContextFactory<TestDbContext>
{
    public TestDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseSqlite("Data Source=design-time.db")
            .Options;

        return new TestDbContext(options);
    }
}
