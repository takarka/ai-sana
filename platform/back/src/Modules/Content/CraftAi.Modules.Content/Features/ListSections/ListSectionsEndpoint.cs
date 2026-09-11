using CraftAi.Modules.Content.Features.CreateSection;
using CraftAi.Modules.Content.Persistence;
using CraftAi.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.ListSections;

public static class ListSectionsEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapGet("/sections", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .WithName("ListSections");

    private static async Task<IResult> HandleAsync(int? grade, ContentDbContext db, CancellationToken cancellationToken)
    {
        var query = db.Sections.AsNoTracking();
        if (grade is not null)
        {
            query = query.Where(s => s.Grade == grade);
        }

        var items = await query
            .OrderBy(s => s.Grade).ThenBy(s => s.Position)
            .Select(s => new SectionResponse(s.Id, s.Name, s.Grade, s.Position))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
