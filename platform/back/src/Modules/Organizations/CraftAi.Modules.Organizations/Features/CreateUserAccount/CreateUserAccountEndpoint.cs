using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Organizations.Features.CreateUserAccount;

public static class CreateUserAccountEndpoint
{
    public static void Map(IEndpointRouteBuilder users) =>
        users.MapPost("/", CreateUserAccountHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .RequireIdempotencyKey()
            .WithName("CreateUserAccount");
}
