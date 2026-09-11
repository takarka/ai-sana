using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.GetOrganization;

public static class GetOrganizationEndpoint
{
    public static void Map(IEndpointRouteBuilder orgs) =>
        orgs.MapGet("/{orgId:guid}", HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .WithName("GetOrganization");

    private static async Task<IResult> HandleAsync(
        Guid orgId, HttpContext httpContext, OrganizationsDbContext db, CancellationToken cancellationToken)
    {
        var organization = await db.Organizations.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orgId, cancellationToken);
        if (organization is null)
        {
            return Result.Failure<GetOrganizationResponse>(
                Error.NotFound("organization.not-found", "Школа не найдена.")).ToApiResult(httpContext);
        }

        var currentYear = await db.AcademicYears.AsNoTracking()
            .Where(y => y.OrganizationId == orgId)
            .OrderByDescending(y => y.StartsOn)
            .FirstAsync(cancellationToken);

        return Result.Success(new GetOrganizationResponse(
                organization.Id,
                organization.Name,
                organization.Region,
                organization.CreatedAtUtc,
                currentYear.Id,
                currentYear.Name))
            .ToApiResult(httpContext);
    }
}
