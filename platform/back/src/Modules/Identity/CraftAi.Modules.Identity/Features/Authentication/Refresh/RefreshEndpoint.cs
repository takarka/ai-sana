using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Authentication.Refresh;

public static class RefreshEndpoint
{
    public static void Map(IEndpointRouteBuilder auth) =>
        auth.MapPost("/refresh", RefreshHandler.HandleAsync)
            .AllowAnonymous()
            .WithName("RefreshToken");
}
