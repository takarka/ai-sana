namespace CraftAi.Modules.Organizations.Features.ImportUsers.PreviewImport;

public sealed record PreviewImportRowDto(
    int RowNumber, string? FullName, string? ExternalId, string? Role, string? ClassLabel, string Outcome, string? Reason);

public sealed record PreviewImportResponse(
    Guid BatchId, string FileName, int CreateCount, int SkipCount, int ErrorCount, IReadOnlyList<PreviewImportRowDto> Rows);
