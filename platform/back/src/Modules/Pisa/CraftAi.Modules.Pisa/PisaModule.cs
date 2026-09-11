using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;
using CraftAi.Modules.Pisa.Features.ItemBank.GetItem;
using CraftAi.Modules.Pisa.Features.ItemBank.SearchItems;
using CraftAi.Modules.Pisa.Features.ItemBank.UpdateItem;
using CraftAi.Modules.Pisa.Persistence;
using CraftAi.SharedKernel.Modularity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Pisa;

/// <summary>
/// Узкий срез банка заданий PISA (план 09 §3.6): составные задания (стимул + вопросы) с
/// метаданными, без рецензии (план 07 О2) — сохранённое сразу видно ученику. Доступ —
/// политика <c>platform.content</c> (<c>superadmin</c> и методист), как у Content.
/// Тренажёры (<c>Trainers/*</c>) вне этого плана (план 09: «не описывает проверку ответов»).
/// </summary>
public sealed class PisaModule : IModule
{
    public string Name => "Pisa";

    public Type? DbContextType => typeof(PisaDbContext);

    public void AddModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PisaDbContext>(options => options
            .UseNpgsql(configuration.GetConnectionString("craftai"))
            .UseSnakeCaseNamingConvention());
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var pisa = endpoints.MapGroup("/platform/content/pisa");

        CreateItemEndpoint.Map(pisa);
        UpdateItemEndpoint.Map(pisa);
        GetItemEndpoint.Map(pisa);
        SearchItemsEndpoint.Map(pisa);
    }
}
