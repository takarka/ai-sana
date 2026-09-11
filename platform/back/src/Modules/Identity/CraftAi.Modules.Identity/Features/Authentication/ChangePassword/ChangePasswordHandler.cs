using System.Security.Claims;
using CraftAi.Modules.Identity.Audit;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Security;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace CraftAi.Modules.Identity.Features.Authentication.ChangePassword;

internal static class ChangePasswordHandler
{
    public static async Task<IResult> HandleAsync(
        ChangePasswordRequest request,
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        RefreshTokenService refreshTokens,
        LoginAuditLogger audit,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = userId is null ? null : await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result.Failure(
                Error.Unauthorized("change-password.no-user", "Не удалось определить пользователя.")).ToApiResult(httpContext);
        }

        var identityResult = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!identityResult.Succeeded)
        {
            var message = string.Join("; ", identityResult.Errors.Select(e => e.Description));
            return Result.Failure(Error.Validation("change-password.failed", message)).ToApiResult(httpContext);
        }

        user.MustChangePassword = false;
        await userManager.UpdateAsync(user);

        // Смена пароля обязана обесточить все текущие сессии (API-02), включая ту, что её
        // вызвала — фронтенд после успеха обязан сходить в /auth/login заново.
        await refreshTokens.RevokeAllForUserAsync(user.Id, cancellationToken);
        RefreshCookie.Clear(httpContext);

        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();
        await audit.LogAsync(LoginAuditEventType.PasswordChanged, user.Id, ipAddress, userAgent, null, cancellationToken);

        return Result.Success().ToApiResult(httpContext);
    }
}
