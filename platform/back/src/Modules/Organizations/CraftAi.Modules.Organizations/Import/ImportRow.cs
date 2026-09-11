using CraftAi.Modules.Organizations.Domain;

namespace CraftAi.Modules.Organizations.Import;

public enum ImportRowOutcome
{
    /// <summary>Строка годна — при фиксации по ней будет заведена учётная запись.</summary>
    Create,

    /// <summary>Учётная запись с этим внешним идентификатором в организации уже есть (FR-CORE-08).</summary>
    SkipDuplicate,

    /// <summary>Строка не прошла разбор или ссылается на несуществующий класс.</summary>
    Error,
}

/// <summary>Построчный результат разбора XLSX — ровно то, что видит администратор в предпросмотре.</summary>
public sealed record ImportRow(
    int RowNumber,
    string? FullName,
    string? ExternalId,
    OrganizationMemberRole? Role,
    int? Grade,
    string? Letter,
    ImportRowOutcome Outcome,
    string? Reason)
{
    /// <summary>Заполняется на шаге commit класс-группой, найденной по (<see cref="Grade"/>, <see cref="Letter"/>).</summary>
    public Guid? ClassGroupId { get; init; }
}
