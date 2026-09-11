using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;

namespace CraftAi.Modules.Organizations.Features.CreateOrganization;

internal static class CreateOrganizationHandler
{
    public static async Task<IResult> HandleAsync(
        CreateOrganizationRequest request,
        HttpContext httpContext,
        OrganizationsDbContext db,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<CreateOrganizationResponse>(
                Error.Validation("organization.name-required", "Название школы обязательно.")).ToApiResult(httpContext);
        }

        var now = timeProvider.GetUtcNow();
        var (startsOn, endsOn, yearName) = AcademicYearCalendar.CurrentFor(now);

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Region = string.IsNullOrWhiteSpace(request.Region) ? null : request.Region.Trim(),
            CreatedAtUtc = now,
        };

        var academicYear = new AcademicYear
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            Name = yearName,
            StartsOn = startsOn,
            EndsOn = endsOn,
        };

        db.Organizations.Add(organization);
        db.AcademicYears.Add(academicYear);

        // Обе записи одной транзакцией (план 09 §3.3, A2.2) — SaveChangesAsync одним вызовом
        // на изменённый набор сущностей уже атомарен на уровне EF Core/Npgsql, отдельная
        // BeginTransaction не нужна.
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new CreateOrganizationResponse(
                organization.Id, organization.Name, organization.Region, academicYear.Id, academicYear.Name))
            .ToApiResult(httpContext, value => Results.Created($"/platform/orgs/{value.Id}", value));
    }
}
