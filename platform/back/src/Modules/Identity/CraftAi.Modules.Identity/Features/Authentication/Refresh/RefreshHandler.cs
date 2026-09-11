using CraftAi.Modules.Identity.Audit;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Security;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;

namespace CraftAi.Modules.Identity.Features.Authentication.Refresh;

internal static class RefreshHandler
{
    public static async Task<IResult> HandleAsync(
        HttpContext httpContext,
        UserManager<ApplicationUser> userManager,
        RefreshTokenService refreshTokens,
        JwtTokenService jwtTokens,
        LoginAuditLogger audit,
        CancellationToken cancellationToken)
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();

        var rawToken = RefreshCookie.Read(httpContext);
        if (rawToken is null)
        {
            return Result.Failure<AuthTokenResponse>(
                Error.Unauthorized("refresh.missing-token", "Нет refresh-токена.")).ToApiResult(httpContext);
        }

        var rotation = await refreshTokens.RotateAsync(rawToken, userAgent, cancellationToken);

        switch (rotation.Outcome)
        {
            case RefreshOutcome.ReuseDetected:
                RefreshCookie.Clear(httpContext);
                await audit.LogAsync(
                    LoginAuditEventType.RefreshReuseDetected, rotation.UserId, ipAddress, userAgent, null, cancellationToken);
                return Result.Failure<AuthTokenResponse>(
                    Error.Unauthorized("refresh.reuse-detected", "Сессия отозвана — войдите заново.")).ToApiResult(httpContext);

            case RefreshOutcome.Invalid:
            case RefreshOutcome.Expired:
                RefreshCookie.Clear(httpContext);
                return Result.Failure<AuthTokenResponse>(
                    Error.Unauthorized("refresh.invalid", "Сессия недействительна — войдите заново.")).ToApiResult(httpContext);
        }

        var user = await userManager.FindByIdAsync(rotation.UserId!.Value.ToString());
        if (user is null)
        {
            RefreshCookie.Clear(httpContext);
            return Result.Failure<AuthTokenResponse>(
                Error.Unauthorized("refresh.invalid", "Сессия недействительна — войдите заново.")).ToApiResult(httpContext);
        }

        var roles = await userManager.GetRolesAsync(user);
        var (accessToken, accessExpiresAtUtc) = jwtTokens.CreateAccessToken(user, roles.ToArray());

        RefreshCookie.Set(httpContext, rotation.RawToken!, rotation.ExpiresAtUtc!.Value);

        await audit.LogAsync(LoginAuditEventType.TokenRefreshed, user.Id, ipAddress, userAgent, null, cancellationToken);

        return Result.Success(new AuthTokenResponse(accessToken, accessExpiresAtUtc, user.MustChangePassword, roles.ToArray()))
            .ToApiResult(httpContext);
    }
}
