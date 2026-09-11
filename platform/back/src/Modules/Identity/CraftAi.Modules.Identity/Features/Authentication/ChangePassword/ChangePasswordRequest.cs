namespace CraftAi.Modules.Identity.Features.Authentication.ChangePassword;

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
