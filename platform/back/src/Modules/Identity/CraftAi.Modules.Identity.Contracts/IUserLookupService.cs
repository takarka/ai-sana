namespace CraftAi.Modules.Identity.Contracts;

/// <summary>
/// Публичное чтение учётных данных для модулей, которым нужно показать ФИО/логин рядом со
/// своими сущностями (план 09 §3.3, A2.4: список учителей/учеников школы), не имея доступа
/// к <c>identity.users</c> напрямую (план 01 §3).
/// </summary>
public interface IUserLookupService
{
    Task<IReadOnlyDictionary<Guid, UserAccountInfo>> GetUsersAsync(
        IReadOnlyCollection<Guid> userIds, CancellationToken cancellationToken);
}

public sealed record UserAccountInfo(Guid UserId, string Login, string FullName, bool MustChangePassword);
