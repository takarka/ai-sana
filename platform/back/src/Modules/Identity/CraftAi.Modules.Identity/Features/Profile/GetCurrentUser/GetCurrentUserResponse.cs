namespace CraftAi.Modules.Identity.Features.Profile.GetCurrentUser;

public sealed record GetCurrentUserResponse(
    Guid Id,
    string Email,
    string FullName,
    string PreferredLanguage,
    bool MustChangePassword,
    IReadOnlyList<string> Roles);
