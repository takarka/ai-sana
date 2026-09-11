using CraftAi.Modules.Identity.Audit;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Security;
using Microsoft.AspNetCore.Http;

namespace CraftAi.Modules.Identity.Features.Authentication.Logout;

internal static class LogoutHandler
{
    public static async Task<IResult> HandleAsync(
        HttpContext httpContext,
        RefreshTokenService refreshTokens,
        LoginAuditLogger audit,
        CancellationToken cancellationToken)
    {
        var rawToken = RefreshCookie.Read(httpContext);
        RefreshCookie.Clear(httpContext);

        if (rawToken is not null)
        {
            var userId = await refreshTokens.RevokeByRawTokenAsync(rawToken, cancellationToken);
            if (userId is not null)
            {
                var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = httpContext.Request.Headers.UserAgent.ToString();
                await audit.LogAsync(LoginAuditEventType.Logout, userId, ipAddress, userAgent, null, cancellationToken);
            }
        }

        return Results.NoContent();
    }
}
