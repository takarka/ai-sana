using CraftAi.MigrationService;
using CraftAi.ServiceDefaults;
using CraftAi.SharedKernel.Modularity;

var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();

// Модули появятся с A1 (Identity) — та же строка, что и в CraftAi.Api.
IReadOnlyList<IModule> modules = [];

foreach (var module in modules)
{
    module.AddModule(builder.Services, builder.Configuration);
}

var dbContextTypes = modules
    .Select(m => m.DbContextType)
    .OfType<Type>()
    .ToArray();

builder.Services.AddHostedService(sp => new MigrationWorker(
    sp,
    dbContextTypes,
    sp.GetRequiredService<IHostApplicationLifetime>(),
    sp.GetRequiredService<ILogger<MigrationWorker>>()));

var host = builder.Build();
await host.RunAsync();

public partial class Program;
