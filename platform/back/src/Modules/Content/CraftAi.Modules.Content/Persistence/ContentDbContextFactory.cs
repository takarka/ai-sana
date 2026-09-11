using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CraftAi.Modules.Content.Persistence;

/// <summary>Design-time фабрика для `dotnet ef migrations add` — рантайму не нужна.</summary>
public sealed class ContentDbContextFactory : IDesignTimeDbContextFactory<ContentDbContext>
{
    public ContentDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ContentDbContext>()
            .UseNpgsql("Host=localhost;Database=design-time;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;

        return new ContentDbContext(options);
    }
}
