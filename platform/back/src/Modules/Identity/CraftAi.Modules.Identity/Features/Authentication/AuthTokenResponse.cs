namespace CraftAi.Modules.Identity.Features.Authentication;

/// <summary>
/// Общая форма ответа Login и Refresh — оба выдают новую пару токенов. Refresh-токен
/// в теле не возвращается — уходит httpOnly-cookie'й (план 05 §7.1); access-токен
/// фронтенд держит в памяти.
/// </summary>
public sealed record AuthTokenResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    bool MustChangePassword,
    IReadOnlyList<string> Roles);
