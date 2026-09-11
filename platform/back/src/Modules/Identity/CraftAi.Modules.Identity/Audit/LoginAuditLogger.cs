using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Persistence;

namespace CraftAi.Modules.Identity.Audit;

/// <summary>
/// Журнал входов (FR-CORE-11). Пишет и только пишет — ни один вызывающий код не
/// правит и не удаляет события; это и есть гарантия неизменности в срезе A1.
/// </summary>
public sealed class LoginAuditLogger(IdentityDbContext db, TimeProvider timeProvider)
{
    public async Task LogAsync(
        LoginAuditEventType eventType,
        Guid? userId,
        string? ipAddress,
        string? userAgent,
        string? details,
        CancellationToken cancellationToken)
    {
        db.LoginAuditEvents.Add(new LoginAuditEvent
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = timeProvider.GetUtcNow(),
            UserId = userId,
            EventType = eventType,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Details = details,
        });

        await db.SaveChangesAsync(cancellationToken);
    }
}
