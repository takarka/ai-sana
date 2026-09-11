namespace CraftAi.Modules.Organizations.Features.ImportUsers.CommitImport;

/// <param name="GeneratedPassword">Показывается один раз — платформа хранит только хеш (см. CreateUserAccount).</param>
public sealed record CommittedAccount(
    int RowNumber, string FullName, string? ExternalId, string Login, string GeneratedPassword, string Role);

public sealed record CommitImportResponse(
    Guid BatchId, int CreatedCount, int SkippedCount, IReadOnlyList<CommittedAccount> CreatedAccounts);
