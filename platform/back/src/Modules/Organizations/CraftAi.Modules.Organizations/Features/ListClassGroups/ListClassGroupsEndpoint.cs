using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Organizations.Features.CreateClassGroup;
using CraftAi.Modules.Organizations.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.ListClassGroups;

public static class ListClassGroupsEndpoint
{
    public static void Map(IEndpointRouteBuilder classes) =>
        classes.MapGet("/", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .WithName("ListClassGroups");

    private static async Task<IResult> HandleAsync(Guid orgId, OrganizationsDbContext db, CancellationToken cancellationToken)
    {
        var items = await db.ClassGroups.AsNoTracking()
            .Where(c => c.OrganizationId == orgId)
            .OrderBy(c => c.Grade).ThenBy(c => c.Letter)
            .Select(c => new ClassGroupResponse(c.Id, c.OrganizationId, c.AcademicYearId, c.Grade, c.Letter))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
