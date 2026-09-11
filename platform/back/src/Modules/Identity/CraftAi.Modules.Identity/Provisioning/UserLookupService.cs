using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Identity.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Identity.Provisioning;

/// <summary>Реализация <see cref="IUserLookupService"/> — план 09 §3.3, A2.4.</summary>
public sealed class UserLookupService(IdentityDbContext db) : IUserLookupService
{
    public async Task<IReadOnlyDictionary<Guid, UserAccountInfo>> GetUsersAsync(
        IReadOnlyCollection<Guid> userIds, CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, UserAccountInfo>();
        }

        var users = await db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new UserAccountInfo(u.Id, u.UserName ?? u.Email ?? string.Empty, u.FullName, u.MustChangePassword))
            .ToListAsync(cancellationToken);

        return users.ToDictionary(u => u.UserId);
    }
}
