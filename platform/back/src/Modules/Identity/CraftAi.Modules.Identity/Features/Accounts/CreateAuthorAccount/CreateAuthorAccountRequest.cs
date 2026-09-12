namespace CraftAi.Modules.Identity.Features.Accounts.CreateAuthorAccount;

/// <param name="Email">
/// Настоящая почта методиста — в отличие от учителей/учеников (план 08 §4), у методиста
/// платформы она есть, и админ вводит её сам вместо синтетического логина.
/// </param>
public sealed record CreateAuthorAccountRequest(string FullName, string Email);
