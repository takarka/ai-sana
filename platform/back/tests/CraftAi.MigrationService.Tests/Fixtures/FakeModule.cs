using CraftAi.SharedKernel.Modularity;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>Минимальный IModule для проверки MigrationWorker — без реального DI-контента.</summary>
public sealed class FakeModule(string name, Type? dbContextType = null, Func<IServiceProvider, CancellationToken, Task>? seed = null)
    : IModule
{
    public string Name => name;

    public bool SeedCalled { get; private set; }

    public void AddModule(IServiceCollection services, IConfiguration configuration)
    {
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
    }

    public Type? DbContextType => dbContextType;

    public async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        SeedCalled = true;
        if (seed is not null)
        {
            await seed(services, cancellationToken);
        }
    }
}
