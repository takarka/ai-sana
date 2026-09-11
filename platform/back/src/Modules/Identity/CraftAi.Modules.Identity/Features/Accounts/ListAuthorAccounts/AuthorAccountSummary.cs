namespace CraftAi.Modules.Identity.Features.Accounts.ListAuthorAccounts;

public sealed record AuthorAccountSummary(
    Guid UserId,
    string FullName,
    string Login,
    bool MustChangePassword,
    DateTimeOffset CreatedAtUtc);
