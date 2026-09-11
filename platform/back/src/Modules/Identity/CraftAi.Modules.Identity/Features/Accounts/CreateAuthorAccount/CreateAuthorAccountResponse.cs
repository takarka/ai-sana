namespace CraftAi.Modules.Identity.Features.Accounts.CreateAuthorAccount;

/// <param name="GeneratedPassword">
/// Показывается администратору один раз в ответе на создание — платформа его не хранит
/// (только хеш в Identity), поэтому клиент обязан показать его сразу.
/// </param>
public sealed record CreateAuthorAccountResponse(Guid UserId, string Login, string GeneratedPassword, string FullName);
