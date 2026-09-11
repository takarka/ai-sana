using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Pisa.Domain;
using CraftAi.Modules.Pisa.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Pisa.Features.ItemBank.SearchItems;

/// <summary>Полнотекстовый поиск и фильтры (FR-PSA-01) — план 09 §3.6.</summary>
public static class SearchItemsEndpoint
{
    public static void Map(IEndpointRouteBuilder pisa) =>
        pisa.MapGet("/items", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .WithName("SearchPisaItems");

    private static async Task<IResult> HandleAsync(
        string? search, string? direction, int? level, int? grade, int? page, int? pageSize,
        PisaDbContext db, CancellationToken cancellationToken)
    {
        var pageNumber = page is null or <= 0 ? 1 : page.Value;
        var pageSizeValue = pageSize is null or <= 0 or > 200 ? 50 : pageSize.Value;

        var query = db.Items.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(i =>
                EF.Functions.ToTsVector("russian", i.SearchText).Matches(EF.Functions.PlainToTsQuery("russian", search)));
        }

        if (!string.IsNullOrWhiteSpace(direction) && Enum.TryParse<ItemDirection>(direction, ignoreCase: true, out var parsedDirection))
        {
            query = query.Where(i => i.Direction == parsedDirection);
        }

        if (level is not null)
        {
            query = query.Where(i => i.Level == level);
        }

        if (grade is not null)
        {
            query = query.Where(i => i.GradeRangeMin <= grade && grade <= i.GradeRangeMax);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(i => i.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSizeValue)
            .Take(pageSizeValue)
            .Select(i => new ItemSummary(
                i.Id, i.SearchText, i.Direction.ToString(), i.CognitiveProcess, i.Context, i.Level,
                i.ExpectedTimeMinutes, i.GradeRangeMin, i.GradeRangeMax, i.AuthorId, i.CreatedAtUtc,
                db.ItemQuestions.Count(q => q.ItemId == i.Id)))
            .ToListAsync(cancellationToken);

        return Results.Ok(new SearchItemsResponse(items, totalCount));
    }
}
