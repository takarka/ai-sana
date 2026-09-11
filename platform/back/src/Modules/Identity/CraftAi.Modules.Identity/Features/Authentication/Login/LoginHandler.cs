using CraftAi.Modules.Identity.Audit;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Security;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace CraftAi.Modules.Identity.Features.Authentication.Login;

internal static class LoginHandler
{
    public static async Task<IResult> HandleAsync(
        LoginRequest request,
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        RefreshTokenService refreshTokens,
        JwtTokenService jwtTokens,
        LoginAuditLogger audit,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Result.Failure<AuthTokenResponse>(
                Error.Validation("login.invalid-request", "E-mail и пароль обязательны.")).ToApiResult(httpContext);
        }

        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            await audit.LogAsync(
                LoginAuditEventType.LoginFailed, user?.Id, ipAddress, userAgent, $"email={request.Email}", cancellationToken);

            return Result.Failure<AuthTokenResponse>(
                Error.Unauthorized("login.invalid-credentials", "Неверный e-mail или пароль.")).ToApiResult(httpContext);
        }

        var roles = await userManager.GetRolesAsync(user);
        var (accessToken, accessExpiresAtUtc) = jwtTokens.CreateAccessToken(user, roles.ToArray());
        var (rawRefresh, refreshEntity) = await refreshTokens.IssueNewFamilyAsync(user.Id, userAgent, cancellationToken);

        RefreshCookie.Set(httpContext, rawRefresh, refreshEntity.ExpiresAtUtc);

        await audit.LogAsync(LoginAuditEventType.LoginSucceeded, user.Id, ipAddress, userAgent, null, cancellationToken);

        return Result.Success(new AuthTokenResponse(accessToken, accessExpiresAtUtc, user.MustChangePassword, roles.ToArray()))
            .ToApiResult(httpContext);
    }
}
