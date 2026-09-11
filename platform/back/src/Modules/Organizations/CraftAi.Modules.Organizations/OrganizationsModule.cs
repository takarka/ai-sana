using CraftAi.Modules.Organizations.Features.CreateClassGroup;
using CraftAi.Modules.Organizations.Features.CreateOrganization;
using CraftAi.Modules.Organizations.Features.CreateUserAccount;
using CraftAi.Modules.Organizations.Features.GetOrganization;
using CraftAi.Modules.Organizations.Features.ImportUsers.CommitImport;
using CraftAi.Modules.Organizations.Features.ImportUsers.PreviewImport;
using CraftAi.Modules.Organizations.Features.ListClassGroups;
using CraftAi.Modules.Organizations.Features.ListOrganizations;
using CraftAi.Modules.Organizations.Features.ListUserAccounts;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel.Modularity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Organizations;

/// <summary>
/// Ядро админ-панели (план 09 §3.3): школы, классы, учётные записи, импорт XLSX. Все
/// маршруты — контур <c>platform</c>, доступны только <c>superadmin</c>.
/// </summary>
public sealed class OrganizationsModule : IModule
{
    public string Name => "Organizations";

    public Type? DbContextType => typeof(OrganizationsDbContext);

    public void AddModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<OrganizationsDbContext>(options => options
            .UseNpgsql(configuration.GetConnectionString("craftai"))
            .UseSnakeCaseNamingConvention());
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var orgs = endpoints.MapGroup("/platform/orgs");
        CreateOrganizationEndpoint.Map(orgs);
        ListOrganizationsEndpoint.Map(orgs);
        GetOrganizationEndpoint.Map(orgs);

        var classes = orgs.MapGroup("/{orgId:guid}/classes");
        CreateClassGroupEndpoint.Map(classes);
        ListClassGroupsEndpoint.Map(classes);

        var users = orgs.MapGroup("/{orgId:guid}/users");
        CreateUserAccountEndpoint.Map(users);
        ListUserAccountsEndpoint.Map(users);

        var import = users.MapGroup("/import");
        PreviewImportEndpoint.Map(import);
        CommitImportEndpoint.Map(import);
    }
}
