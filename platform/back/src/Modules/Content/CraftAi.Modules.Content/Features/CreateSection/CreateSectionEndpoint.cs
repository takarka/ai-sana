using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.CreateSection;

public static class CreateSectionEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPost("/sections", CreateSectionHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("CreateSection");
}
