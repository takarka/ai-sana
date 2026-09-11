namespace CraftAi.Modules.Organizations.Features.CreateUserAccount;

/// <param name="GeneratedPassword">
/// Показывается администратору один раз в ответе на создание — платформа его не хранит
/// (только хеш в Identity), поэтому клиент обязан показать его сразу.
/// </param>
public sealed record CreateUserAccountResponse(
    Guid MemberId,
    Guid UserId,
    string Login,
    string GeneratedPassword,
    string Role,
    Guid? ClassGroupId);
