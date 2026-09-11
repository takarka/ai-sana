using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;
using CraftAi.Modules.Pisa.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Pisa.Features.ItemBank.GetItem;

public static class GetItemEndpoint
{
    public static void Map(IEndpointRouteBuilder pisa) =>
        pisa.MapGet("/items/{itemId:guid}", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .WithName("GetPisaItem");

    private static async Task<IResult> HandleAsync(
        Guid itemId, HttpContext httpContext, PisaDbContext db, CancellationToken cancellationToken)
    {
        var item = await db.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
        if (item is null)
        {
            return Result.Failure<ItemResponse>(
                Error.NotFound("item.not-found", "Задание не найдено.")).ToApiResult(httpContext);
        }

        var questions = await db.ItemQuestions.AsNoTracking()
            .Where(q => q.ItemId == itemId)
            .OrderBy(q => q.Position)
            .ToListAsync(cancellationToken);

        return Result.Success(ItemResponseFactory.ToResponse(item, questions)).ToApiResult(httpContext);
    }
}
