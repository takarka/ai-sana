using Microsoft.AspNetCore.Http;

namespace CraftAi.Modules.Identity.Security;

/// <summary>
/// Refresh-токен — httpOnly-cookie, не тело ответа (план 05 §7.1). Область — только
/// <c>/auth/*</c>: незачем нести его на каждый обычный запрос к API.
/// </summary>
public static class RefreshCookie
{
    public const string Name = "refresh_token";

    public static void Set(HttpContext context, string rawToken, DateTimeOffset expiresAtUtc) =>
        context.Response.Cookies.Append(Name, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/auth",
            Expires = expiresAtUtc,
        });

    public static string? Read(HttpContext context) =>
        context.Request.Cookies.TryGetValue(Name, out var value) ? value : null;

    public static void Clear(HttpContext context) =>
        context.Response.Cookies.Delete(Name, new CookieOptions { Path = "/auth" });
}
