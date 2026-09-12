using System.ComponentModel.DataAnnotations;
using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Identity.Domain;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace CraftAi.Modules.Identity.Features.Accounts.CreateAuthorAccount;

internal static class CreateAuthorAccountHandler
{
    private static readonly EmailAddressAttribute EmailValidator = new();

    public static async Task<IResult> HandleAsync(
        CreateAuthorAccountRequest request,
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        IUserProvisioningService provisioning,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return Result.Failure<CreateAuthorAccountResponse>(
                Error.Validation("author-account.full-name-required", "ФИО обязательно.")).ToApiResult(httpContext);
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return Result.Failure<CreateAuthorAccountResponse>(
                Error.Validation("author-account.email-required", "E-mail обязателен.")).ToApiResult(httpContext);
        }

        var email = request.Email.Trim();
        if (!EmailValidator.IsValid(email))
        {
            return Result.Failure<CreateAuthorAccountResponse>(
                Error.Validation("author-account.invalid-email", "Введите корректный e-mail.")).ToApiResult(httpContext);
        }

        var fullName = request.FullName.Trim();
        var provisioned = await provisioning.ProvisionUserAsync(
            new ProvisionUserRequest(fullName, fullName, email), cancellationToken);
        if (provisioned.IsFailure)
        {
            return Result.Failure<CreateAuthorAccountResponse>(provisioned.Error!).ToApiResult(httpContext);
        }

        var user = await userManager.FindByIdAsync(provisioned.Value.UserId.ToString());
        await userManager.AddToRoleAsync(user!, PlatformRoles.Author);

        return Result.Success(new CreateAuthorAccountResponse(
                provisioned.Value.UserId, provisioned.Value.Login, provisioned.Value.GeneratedPassword, fullName))
            .ToApiResult(httpContext, value => Results.Created($"/platform/authors/{value.UserId}", value));
    }
}
