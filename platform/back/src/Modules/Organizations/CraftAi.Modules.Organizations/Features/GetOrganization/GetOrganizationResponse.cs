namespace CraftAi.Modules.Organizations.Features.GetOrganization;

public sealed record GetOrganizationResponse(
    Guid Id,
    string Name,
    string? Region,
    DateTimeOffset CreatedAtUtc,
    Guid CurrentAcademicYearId,
    string CurrentAcademicYearName);
