namespace CraftAi.Modules.Organizations.Features.CreateUserAccount;

/// <param name="Role">"teacher" | "student".</param>
/// <param name="ClassGroupId">Обязателен для ученика, игнорируется для учителя (план 08 О2).</param>
public sealed record CreateUserAccountRequest(string FullName, string Role, Guid? ClassGroupId);
