using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>Design-time фабрика для `dotnet ef migrations add` — рантайму не нужна.</summary>
public sealed class PostgresTestDbContextFactory : IDesignTimeDbContextFactory<PostgresTestDbContext>
{
    public PostgresTestDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PostgresTestDbContext>()
            .UseNpgsql("Host=localhost;Database=design-time;Username=postgres;Password=postgres")
            .Options;

        return new PostgresTestDbContext(options);
    }
}
