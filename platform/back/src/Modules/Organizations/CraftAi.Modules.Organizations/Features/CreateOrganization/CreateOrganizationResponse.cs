namespace CraftAi.Modules.Organizations.Features.CreateOrganization;

public sealed record CreateOrganizationResponse(
    Guid Id,
    string Name,
    string? Region,
    Guid AcademicYearId,
    string AcademicYearName);
