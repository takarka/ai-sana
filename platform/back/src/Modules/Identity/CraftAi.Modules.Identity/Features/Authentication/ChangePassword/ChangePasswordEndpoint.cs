using Microsoft.AspNetCore.Builder;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Authentication.ChangePassword;

public static class ChangePasswordEndpoint
{
    public static void Map(IEndpointRouteBuilder auth) =>
        auth.MapPost("/change-password", ChangePasswordHandler.HandleAsync)
            .RequireAuthorization()
            .RequireIdempotencyKey()
            .WithName("ChangePassword");
}
