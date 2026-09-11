using Microsoft.AspNetCore.Builder;
using System.Security.Claims;
using CraftAi.Modules.Identity.Domain;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Profile.GetCurrentUser;

public static class GetCurrentUserEndpoint
{
    public static void Map(IEndpointRouteBuilder endpoints) =>
        endpoints.MapGet("/me", HandleAsync)
            .RequireAuthorization()
            .WithName("GetCurrentUser");

    private static async Task<IResult> HandleAsync(
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = userId is null ? null : await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        var roles = await userManager.GetRolesAsync(user);

        return Results.Ok(new GetCurrentUserResponse(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.PreferredLanguage,
            user.MustChangePassword,
            roles.ToArray()));
    }
}
