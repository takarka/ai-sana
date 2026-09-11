using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Import;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.ImportUsers.CommitImport;

internal static class CommitImportHandler
{
    public static async Task<IResult> HandleAsync(
        Guid orgId,
        Guid batchId,
        HttpContext httpContext,
        OrganizationsDbContext db,
        IUserProvisioningService provisioning,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var batch = await db.UserImportBatches.FirstOrDefaultAsync(
            b => b.Id == batchId && b.OrganizationId == orgId, cancellationToken);
        if (batch is null)
        {
            return Result.Failure<CommitImportResponse>(
                Error.NotFound("import.batch-not-found", "Предпросмотр импорта не найден.")).ToApiResult(httpContext);
        }

        if (batch.Status == ImportBatchStatus.Committed)
        {
            return Result.Failure<CommitImportResponse>(
                Error.Conflict("import.already-committed", "Этот импорт уже зафиксирован.")).ToApiResult(httpContext);
        }

        var rows = ImportRowSerializer.Deserialize(batch.PreviewJson);
        var createRows = rows.Where(r => r.Outcome == ImportRowOutcome.Create).ToList();

        // Защита от гонки: внешний идентификатор мог быть занят другим импортом/созданием
        // между preview и commit (FR-CORE-08 требует отсутствия дублей, а не падения commit'а).
        var candidateIds = createRows.Where(r => r.ExternalId is not null).Select(r => r.ExternalId!).ToHashSet();
        var alreadyTakenIds = (await db.OrganizationMembers.AsNoTracking()
                .Where(m => m.OrganizationId == orgId && m.ExternalId != null && candidateIds.Contains(m.ExternalId!))
                .Select(m => m.ExternalId!)
                .ToListAsync(cancellationToken))
            .ToHashSet();

        var createdAccounts = new List<CommittedAccount>();
        var skippedCount = 0;
        var now = timeProvider.GetUtcNow();

        foreach (var row in createRows)
        {
            if (row.ExternalId is not null && alreadyTakenIds.Contains(row.ExternalId))
            {
                skippedCount++;
                continue;
            }

            var provisioned = await provisioning.ProvisionUserAsync(
                new ProvisionUserRequest(row.FullName!, row.ExternalId ?? row.FullName!), cancellationToken);
            if (provisioned.IsFailure)
            {
                skippedCount++;
                continue;
            }

            var member = new OrganizationMember
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                UserId = provisioned.Value.UserId,
                Role = row.Role!.Value,
                ClassGroupId = row.ClassGroupId,
                ExternalId = row.ExternalId,
                CreatedAtUtc = now,
            };
            db.OrganizationMembers.Add(member);

            createdAccounts.Add(new CommittedAccount(
                row.RowNumber, row.FullName!, row.ExternalId, provisioned.Value.Login, provisioned.Value.GeneratedPassword,
                row.Role.Value.ToString().ToLowerInvariant()));
        }

        batch.Status = ImportBatchStatus.Committed;
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new CommitImportResponse(batch.Id, createdAccounts.Count, skippedCount, createdAccounts))
            .ToApiResult(httpContext);
    }
}
