using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Organizations.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.ListOrganizations;

public static class ListOrganizationsEndpoint
{
    public static void Map(IEndpointRouteBuilder orgs) =>
        orgs.MapGet("/", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .WithName("ListOrganizations");

    private static async Task<IResult> HandleAsync(
        OrganizationsDbContext db,
        string? search,
        int? page,
        int? pageSize,
        CancellationToken cancellationToken)
    {
        var pageNumber = page is null or <= 0 ? 1 : page.Value;
        var pageSizeValue = pageSize is null or <= 0 or > 200 ? 50 : pageSize.Value;

        var query = db.Organizations.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(o => EF.Functions.ILike(o.Name, $"%{search}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(o => o.Name)
            .Skip((pageNumber - 1) * pageSizeValue)
            .Take(pageSizeValue)
            .Select(o => new OrganizationSummary(o.Id, o.Name, o.Region, o.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Results.Ok(new ListOrganizationsResponse(items, totalCount));
    }
}
