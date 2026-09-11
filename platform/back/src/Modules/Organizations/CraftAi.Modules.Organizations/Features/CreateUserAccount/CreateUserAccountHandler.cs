using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.CreateUserAccount;

internal static class CreateUserAccountHandler
{
    public static async Task<IResult> HandleAsync(
        Guid orgId,
        CreateUserAccountRequest request,
        HttpContext httpContext,
        OrganizationsDbContext db,
        IUserProvisioningService provisioning,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return Result.Failure<CreateUserAccountResponse>(
                Error.Validation("user-account.full-name-required", "ФИО обязательно.")).ToApiResult(httpContext);
        }

        var role = ParseRole(request.Role);
        if (role is null)
        {
            return Result.Failure<CreateUserAccountResponse>(
                Error.Validation("user-account.invalid-role", "Роль должна быть «teacher» или «student».")).ToApiResult(httpContext);
        }

        if (!await db.Organizations.AsNoTracking().AnyAsync(o => o.Id == orgId, cancellationToken))
        {
            return Result.Failure<CreateUserAccountResponse>(
                Error.NotFound("organization.not-found", "Школа не найдена.")).ToApiResult(httpContext);
        }

        if (role == OrganizationMemberRole.Student)
        {
            if (request.ClassGroupId is null)
            {
                return Result.Failure<CreateUserAccountResponse>(
                    Error.Validation("user-account.class-required", "Ученику обязательно нужно указать класс.")).ToApiResult(httpContext);
            }

            var classBelongsToOrg = await db.ClassGroups.AsNoTracking()
                .AnyAsync(c => c.Id == request.ClassGroupId && c.OrganizationId == orgId, cancellationToken);
            if (!classBelongsToOrg)
            {
                return Result.Failure<CreateUserAccountResponse>(
                    Error.NotFound("class-group.not-found", "Класс не найден в этой школе.")).ToApiResult(httpContext);
            }
        }

        var fullName = request.FullName.Trim();
        var provisioned = await provisioning.ProvisionUserAsync(
            new ProvisionUserRequest(fullName, fullName), cancellationToken);
        if (provisioned.IsFailure)
        {
            return Result.Failure<CreateUserAccountResponse>(provisioned.Error!).ToApiResult(httpContext);
        }

        var member = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            UserId = provisioned.Value.UserId,
            Role = role.Value,
            ClassGroupId = role == OrganizationMemberRole.Student ? request.ClassGroupId : null,
            ExternalId = null,
            CreatedAtUtc = timeProvider.GetUtcNow(),
        };

        db.OrganizationMembers.Add(member);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new CreateUserAccountResponse(
                member.Id, member.UserId, provisioned.Value.Login, provisioned.Value.GeneratedPassword,
                request.Role, member.ClassGroupId))
            .ToApiResult(httpContext, value => Results.Created($"/platform/orgs/{orgId}/users/{value.MemberId}", value));
    }

    private static OrganizationMemberRole? ParseRole(string raw) => raw.Trim().ToLowerInvariant() switch
    {
        "teacher" => OrganizationMemberRole.Teacher,
        "student" => OrganizationMemberRole.Student,
        _ => null,
    };
}
