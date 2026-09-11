using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

public static class CreateItemEndpoint
{
    public static void Map(IEndpointRouteBuilder pisa) =>
        pisa.MapPost("/items", CreateItemHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("CreatePisaItem");
}
