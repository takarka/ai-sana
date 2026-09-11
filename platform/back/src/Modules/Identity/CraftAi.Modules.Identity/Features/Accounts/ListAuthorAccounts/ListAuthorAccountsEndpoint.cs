using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Identity.Domain;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Identity.Features.Accounts.ListAuthorAccounts;

public static class ListAuthorAccountsEndpoint
{
    public static void Map(IEndpointRouteBuilder authors) =>
        authors.MapGet("/", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .WithName("ListAuthorAccounts");

    private static async Task<IResult> HandleAsync(UserManager<ApplicationUser> userManager)
    {
        var users = await userManager.GetUsersInRoleAsync(PlatformRoles.Author);

        var items = users
            .OrderBy(u => u.CreatedAtUtc)
            .Select(u => new AuthorAccountSummary(u.Id, u.FullName, u.UserName ?? string.Empty, u.MustChangePassword, u.CreatedAtUtc));

        return Results.Ok(items);
    }
}
