using CraftAi.SharedKernel;

namespace CraftAi.Modules.Identity.Contracts;

/// <summary>
/// Публичный контракт <c>Identity</c> для модулей, которым нужно завести учётную запись,
/// не зная о её внутреннем устройстве (план 01 §3: «CraftAi.Modules.A может ссылаться на
/// CraftAi.Modules.B.Contracts, но никогда на CraftAi.Modules.B»). Первый потребитель —
/// <c>Organizations</c> (план 09 §3.3, A2.4/A2.7): создание и импорт учителей/учеников.
/// </summary>
public interface IUserProvisioningService
{
    /// <summary>
    /// Заводит новую учётную запись со сгенерированным логином и паролем, которые нужно
    /// сообщить создателю (эта запись не имеет реального e-mail для доставки — план 08 §4:
    /// в v0 учителя/ученики не вводят почту при создании). Обязательная смена пароля при
    /// первом входе выставляется всегда, как и у первого суперадмина (план 09 §3.2, A1.5).
    /// </summary>
    Task<Result<ProvisionedUser>> ProvisionUserAsync(ProvisionUserRequest request, CancellationToken cancellationToken);
}

/// <param name="LoginSeed">
/// Основа логина: внешний идентификатор (ИИН) при наличии, иначе — любая уникальная в
/// рамках вызова строка. Реальным логином становится синтетический адрес на основе этого
/// значения — уникальность физической почты не гарантируется и не требуется.
/// </param>
public sealed record ProvisionUserRequest(string FullName, string LoginSeed);

public sealed record ProvisionedUser(Guid UserId, string Login, string GeneratedPassword);
