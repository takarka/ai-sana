namespace CraftAi.Modules.Organizations.Features.CreateOrganization;

/// <param name="Name">Единственное обязательное поле (план 08 §4).</param>
public sealed record CreateOrganizationRequest(string Name, string? Region);
