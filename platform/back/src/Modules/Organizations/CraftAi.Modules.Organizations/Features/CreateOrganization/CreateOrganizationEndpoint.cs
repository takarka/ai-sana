using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Organizations.Features.CreateOrganization;

public static class CreateOrganizationEndpoint
{
    public static void Map(IEndpointRouteBuilder orgs) =>
        orgs.MapPost("/", CreateOrganizationHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .RequireIdempotencyKey()
            .WithName("CreateOrganization");
}
