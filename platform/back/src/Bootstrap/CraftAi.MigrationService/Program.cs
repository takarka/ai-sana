using CraftAi.MigrationService;
using CraftAi.Modules.Identity;
using CraftAi.Modules.Organizations;
using CraftAi.ServiceDefaults;
using CraftAi.SharedKernel.Modularity;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();

// Каждый модуль регистрируется здесь той же строкой, что и в CraftAi.Api.
IReadOnlyList<IModule> modules = [new IdentityModule(), new OrganizationsModule()];

foreach (var module in modules)
{
    module.AddModule(builder.Services, builder.Configuration);
}

builder.Services.AddHostedService(sp => new MigrationWorker(
    sp,
    modules,
    sp.GetRequiredService<IHostApplicationLifetime>(),
    sp.GetRequiredService<ILogger<MigrationWorker>>()));

var host = builder.Build();
await host.RunAsync();

public partial class Program;
