namespace CraftAi.Modules.Organizations.Features.CreateClassGroup;

public sealed record ClassGroupResponse(Guid Id, Guid OrganizationId, Guid AcademicYearId, int Grade, string Letter);
