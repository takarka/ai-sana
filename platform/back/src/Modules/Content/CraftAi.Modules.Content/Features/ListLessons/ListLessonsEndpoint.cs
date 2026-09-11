using CraftAi.Modules.Content.Features.CreateLesson;
using CraftAi.Modules.Content.Persistence;
using CraftAi.Modules.Identity.Contracts;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.ListLessons;

public static class ListLessonsEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapGet("/lessons", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .WithName("ListLessons");

    private static async Task<IResult> HandleAsync(
        Guid? sectionId, int? grade, ContentDbContext db, CancellationToken cancellationToken)
    {
        var query = db.Lessons.AsNoTracking().AsQueryable();
        if (sectionId is not null)
        {
            query = query.Where(l => l.SectionId == sectionId);
        }

        if (grade is not null)
        {
            query = query.Where(l => db.Sections.Any(s => s.Id == l.SectionId && s.Grade == grade));
        }

        var items = await query
            .OrderBy(l => l.Position)
            .Select(l => new LessonResponse(l.Id, l.SectionId, l.Title, l.Position, l.IsPublished, l.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        return Results.Ok(items);
    }
}
