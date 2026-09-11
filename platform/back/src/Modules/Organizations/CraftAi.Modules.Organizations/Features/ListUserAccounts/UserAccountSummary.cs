namespace CraftAi.Modules.Organizations.Features.ListUserAccounts;

public sealed record UserAccountSummary(
    Guid MemberId,
    Guid UserId,
    string FullName,
    string Login,
    string Role,
    Guid? ClassGroupId,
    string? ExternalId,
    bool MustChangePassword);
