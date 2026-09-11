using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CraftAi.Modules.Organizations.Persistence;

/// <summary>Design-time фабрика для `dotnet ef migrations add` — рантайму не нужна.</summary>
public sealed class OrganizationsDbContextFactory : IDesignTimeDbContextFactory<OrganizationsDbContext>
{
    public OrganizationsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<OrganizationsDbContext>()
            .UseNpgsql("Host=localhost;Database=design-time;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;

        return new OrganizationsDbContext(options);
    }
}
