namespace CraftAi.Modules.Organizations.Features.ListOrganizations;

public sealed record OrganizationSummary(Guid Id, string Name, string? Region, DateTimeOffset CreatedAtUtc);

public sealed record ListOrganizationsResponse(IReadOnlyList<OrganizationSummary> Items, int TotalCount);
