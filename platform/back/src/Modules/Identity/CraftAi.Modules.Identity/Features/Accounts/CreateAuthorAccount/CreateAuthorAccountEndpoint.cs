using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Accounts.CreateAuthorAccount;

public static class CreateAuthorAccountEndpoint
{
    public static void Map(IEndpointRouteBuilder authors) =>
        authors.MapPost("/", CreateAuthorAccountHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .RequireIdempotencyKey()
            .WithName("CreateAuthorAccount");
}
