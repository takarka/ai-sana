using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CraftAi.Modules.Pisa.Persistence;

/// <summary>Design-time фабрика для `dotnet ef migrations add` — рантайму не нужна.</summary>
public sealed class PisaDbContextFactory : IDesignTimeDbContextFactory<PisaDbContext>
{
    public PisaDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PisaDbContext>()
            .UseNpgsql("Host=localhost;Database=design-time;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;

        return new PisaDbContext(options);
    }
}
