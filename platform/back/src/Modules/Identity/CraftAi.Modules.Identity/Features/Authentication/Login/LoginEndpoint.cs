using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Authentication.Login;

public static class LoginEndpoint
{
    public static void Map(IEndpointRouteBuilder auth) =>
        auth.MapPost("/login", LoginHandler.HandleAsync)
            .AllowAnonymous()
            .WithName("Login");
}
