namespace CraftAi.Modules.Organizations.Domain;

public enum ImportBatchStatus
{
    Previewed,
    Committed,
}

/// <summary>
/// Разобранный предпросмотр импорта между шагами preview и commit (план 09 §3.3, A2.6/A2.7).
/// <see cref="PreviewJson"/> хранит построчный результат разбора — commit читает именно его,
/// а не файл повторно, поэтому то, что увидел администратор в предпросмотре, гарантированно
/// совпадает с тем, что будет записано.
/// </summary>
public sealed class UserImportBatch
{
    public Guid Id { get; init; }

    public required Guid OrganizationId { get; init; }

    public required Guid UploadedByUserId { get; init; }

    public required string FileName { get; set; }

    public required ImportBatchStatus Status { get; set; }

    /// <summary>Сериализованный <see cref="System.Collections.Generic.IReadOnlyList{T}"/> из <c>ImportRow</c> (jsonb).</summary>
    public required string PreviewJson { get; set; }

    public DateTimeOffset CreatedAtUtc { get; init; }
}
