using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Import;

/// <summary>
/// Достраивает результат <see cref="XlsxUserImportParser"/> тем, что видно только в БД:
/// дубли по внешнему идентификатору (FR-CORE-08) и существование класса (план 09 §3.3, A2.6).
/// </summary>
public static class ImportRowResolver
{
    public static async Task<IReadOnlyList<ImportRow>> ResolveAsync(
        IReadOnlyList<ImportRow> parsedRows,
        Guid organizationId,
        Guid academicYearId,
        OrganizationsDbContext db,
        CancellationToken cancellationToken)
    {
        var candidateIds = parsedRows
            .Where(r => r.Outcome == ImportRowOutcome.Create && r.ExternalId is not null)
            .Select(r => r.ExternalId!)
            .ToHashSet();

        var existingIds = await db.OrganizationMembers.AsNoTracking()
            .Where(m => m.OrganizationId == organizationId && m.ExternalId != null && candidateIds.Contains(m.ExternalId!))
            .Select(m => m.ExternalId!)
            .ToListAsync(cancellationToken);
        var existingIdSet = existingIds.ToHashSet();

        var classGroups = await db.ClassGroups.AsNoTracking()
            .Where(c => c.OrganizationId == organizationId && c.AcademicYearId == academicYearId)
            .ToListAsync(cancellationToken);
        var classGroupsByKey = classGroups.ToDictionary(c => (c.Grade, c.Letter), c => c.Id);

        var seenInFile = new HashSet<string>();
        var resolved = new List<ImportRow>(parsedRows.Count);

        foreach (var row in parsedRows)
        {
            if (row.Outcome != ImportRowOutcome.Create)
            {
                resolved.Add(row);
                continue;
            }

            if (existingIdSet.Contains(row.ExternalId!))
            {
                resolved.Add(row with { Outcome = ImportRowOutcome.SkipDuplicate, Reason = "Уже импортирован ранее (совпадает ИИН)." });
                continue;
            }

            if (!seenInFile.Add(row.ExternalId!))
            {
                resolved.Add(row with { Outcome = ImportRowOutcome.Error, Reason = "Повторяется в этом же файле." });
                continue;
            }

            if (row.Role == OrganizationMemberRole.Student)
            {
                if (!classGroupsByKey.TryGetValue((row.Grade!.Value, row.Letter!), out var classGroupId))
                {
                    resolved.Add(row with
                    {
                        Outcome = ImportRowOutcome.Error,
                        Reason = $"Класс {row.Grade}{row.Letter} не найден — создайте его перед импортом.",
                    });
                    continue;
                }

                resolved.Add(row with { ClassGroupId = classGroupId });
                continue;
            }

            resolved.Add(row);
        }

        return resolved;
    }
}
