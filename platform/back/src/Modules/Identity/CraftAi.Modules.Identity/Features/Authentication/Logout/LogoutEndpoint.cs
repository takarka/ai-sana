using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Authentication.Logout;

public static class LogoutEndpoint
{
    public static void Map(IEndpointRouteBuilder auth) =>
        auth.MapPost("/logout", LogoutHandler.HandleAsync)
            .RequireAuthorization()
            .WithName("Logout");
}
