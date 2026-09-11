using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.CreateClassGroup;

internal static class CreateClassGroupHandler
{
    public static async Task<IResult> HandleAsync(
        Guid orgId,
        CreateClassGroupRequest request,
        HttpContext httpContext,
        OrganizationsDbContext db,
        CancellationToken cancellationToken)
    {
        if (request.Grade is < 1 or > 11)
        {
            return Result.Failure<ClassGroupResponse>(
                Error.Validation("class-group.invalid-grade", "Параллель должна быть от 1 до 11.")).ToApiResult(httpContext);
        }

        var letter = request.Letter.Trim().ToUpperInvariant();
        if (letter.Length == 0)
        {
            return Result.Failure<ClassGroupResponse>(
                Error.Validation("class-group.letter-required", "Литера обязательна.")).ToApiResult(httpContext);
        }

        var organizationExists = await db.Organizations.AsNoTracking().AnyAsync(o => o.Id == orgId, cancellationToken);
        if (!organizationExists)
        {
            return Result.Failure<ClassGroupResponse>(
                Error.NotFound("organization.not-found", "Школа не найдена.")).ToApiResult(httpContext);
        }

        var academicYear = await db.AcademicYears.AsNoTracking()
            .Where(y => y.OrganizationId == orgId)
            .OrderByDescending(y => y.StartsOn)
            .FirstAsync(cancellationToken);

        var duplicate = await db.ClassGroups.AsNoTracking().AnyAsync(
            c => c.OrganizationId == orgId && c.AcademicYearId == academicYear.Id
                 && c.Grade == request.Grade && c.Letter == letter,
            cancellationToken);
        if (duplicate)
        {
            return Result.Failure<ClassGroupResponse>(
                Error.Conflict("class-group.duplicate", $"Класс {request.Grade}{letter} уже существует в текущем учебном году."))
                .ToApiResult(httpContext);
        }

        var classGroup = new ClassGroup
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            AcademicYearId = academicYear.Id,
            Grade = request.Grade,
            Letter = letter,
        };

        db.ClassGroups.Add(classGroup);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new ClassGroupResponse(
                classGroup.Id, classGroup.OrganizationId, classGroup.AcademicYearId, classGroup.Grade, classGroup.Letter))
            .ToApiResult(httpContext, value => Results.Created($"/platform/orgs/{orgId}/classes/{value.Id}", value));
    }
}
