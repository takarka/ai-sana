using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Pisa.Features.ItemBank.UpdateItem;

public static class UpdateItemEndpoint
{
    public static void Map(IEndpointRouteBuilder pisa) =>
        pisa.MapPut("/items/{itemId:guid}", UpdateItemHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("UpdatePisaItem");
}
