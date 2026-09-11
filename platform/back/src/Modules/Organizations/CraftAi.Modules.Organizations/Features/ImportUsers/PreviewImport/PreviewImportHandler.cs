using System.Security.Claims;
using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Import;
using CraftAi.Modules.Organizations.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Features.ImportUsers.PreviewImport;

internal static class PreviewImportHandler
{
    public static async Task<IResult> HandleAsync(
        Guid orgId,
        IFormFile file,
        HttpContext httpContext,
        OrganizationsDbContext db,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return Result.Failure<PreviewImportResponse>(
                Error.Validation("import.empty-file", "Файл пуст.")).ToApiResult(httpContext);
        }

        if (file.Length > ImportLimits.MaxFileSizeBytes)
        {
            return Result.Failure<PreviewImportResponse>(Error.Validation(
                    "import.file-too-large", $"Файл больше {ImportLimits.MaxFileSizeBytes / 1024 / 1024} МБ."))
                .ToApiResult(httpContext);
        }

        var academicYear = await db.AcademicYears.AsNoTracking()
            .Where(y => y.OrganizationId == orgId)
            .OrderByDescending(y => y.StartsOn)
            .FirstOrDefaultAsync(cancellationToken);
        if (academicYear is null)
        {
            return Result.Failure<PreviewImportResponse>(
                Error.NotFound("organization.not-found", "Школа не найдена.")).ToApiResult(httpContext);
        }

        IReadOnlyList<ImportRow> parsedRows;
        await using (var stream = file.OpenReadStream())
        {
            var parseResult = XlsxUserImportParser.Parse(stream);
            if (parseResult.IsFailure)
            {
                return Result.Failure<PreviewImportResponse>(parseResult.Error!).ToApiResult(httpContext);
            }

            parsedRows = parseResult.Value;
        }

        var resolvedRows = await ImportRowResolver.ResolveAsync(parsedRows, orgId, academicYear.Id, db, cancellationToken);

        var uploadedByUserId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var batch = new UserImportBatch
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            UploadedByUserId = Guid.Parse(uploadedByUserId!),
            FileName = file.FileName,
            Status = ImportBatchStatus.Previewed,
            PreviewJson = ImportRowSerializer.Serialize(resolvedRows),
            CreatedAtUtc = timeProvider.GetUtcNow(),
        };

        db.UserImportBatches.Add(batch);
        await db.SaveChangesAsync(cancellationToken);

        var dtoRows = resolvedRows.Select(r => new PreviewImportRowDto(
                r.RowNumber,
                r.FullName,
                r.ExternalId,
                r.Role?.ToString().ToLowerInvariant(),
                r.Grade is null ? null : $"{r.Grade}{r.Letter}",
                r.Outcome.ToString(),
                r.Reason))
            .ToList();

        var response = new PreviewImportResponse(
            batch.Id,
            batch.FileName,
            dtoRows.Count(r => r.Outcome == nameof(ImportRowOutcome.Create)),
            dtoRows.Count(r => r.Outcome == nameof(ImportRowOutcome.SkipDuplicate)),
            dtoRows.Count(r => r.Outcome == nameof(ImportRowOutcome.Error)),
            dtoRows);

        return Result.Success(response).ToApiResult(httpContext);
    }
}
