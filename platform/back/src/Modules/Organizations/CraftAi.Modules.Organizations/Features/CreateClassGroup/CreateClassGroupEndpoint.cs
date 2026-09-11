using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Organizations.Features.CreateClassGroup;

public static class CreateClassGroupEndpoint
{
    public static void Map(IEndpointRouteBuilder classes) =>
        classes.MapPost("/", CreateClassGroupHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .RequireIdempotencyKey()
            .WithName("CreateClassGroup");
}
