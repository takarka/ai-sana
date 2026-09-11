using CraftAi.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Organizations.Features.ImportUsers.PreviewImport;

public static class PreviewImportEndpoint
{
    public static void Map(IEndpointRouteBuilder import) =>
        import.MapPost("/preview", PreviewImportHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .DisableAntiforgery()
            .WithName("PreviewImportUsers");
}
