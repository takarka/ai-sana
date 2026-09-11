using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.ListUserAccounts;

public static class ListUserAccountsEndpoint
{
    public static void Map(IEndpointRouteBuilder users) =>
        users.MapGet("/", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .WithName("ListUserAccounts");

    private static async Task<IResult> HandleAsync(
        Guid orgId,
        string? role,
        Guid? classGroupId,
        OrganizationsDbContext db,
        IUserLookupService userLookup,
        CancellationToken cancellationToken)
    {
        var query = db.OrganizationMembers.AsNoTracking().Where(m => m.OrganizationId == orgId);
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<OrganizationMemberRole>(role, ignoreCase: true, out var parsedRole))
        {
            query = query.Where(m => m.Role == parsedRole);
        }

        if (classGroupId is not null)
        {
            query = query.Where(m => m.ClassGroupId == classGroupId);
        }

        var members = await query.OrderBy(m => m.CreatedAtUtc).ToListAsync(cancellationToken);
        var userInfos = await userLookup.GetUsersAsync([.. members.Select(m => m.UserId)], cancellationToken);

        var items = members.Select(m =>
        {
            var info = userInfos.GetValueOrDefault(m.UserId);
            return new UserAccountSummary(
                m.Id, m.UserId, info?.FullName ?? string.Empty, info?.Login ?? string.Empty,
                m.Role.ToString().ToLowerInvariant(), m.ClassGroupId, m.ExternalId, info?.MustChangePassword ?? false);
        });

        return Results.Ok(items);
    }
}
