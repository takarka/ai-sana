namespace CraftAi.Modules.Identity.Security;

public enum RefreshOutcome
{
    Success,
    Invalid,
    Expired,

    /// <summary>Предъявлен уже отозванный токен — признак угона; вся семья погашена.</summary>
    ReuseDetected,
}

public sealed record RefreshRotationResult(
    RefreshOutcome Outcome,
    Guid? UserId = null,
    string? RawToken = null,
    DateTimeOffset? ExpiresAtUtc = null)
{
    public static RefreshRotationResult Success(Guid userId, string rawToken, DateTimeOffset expiresAtUtc) =>
        new(RefreshOutcome.Success, userId, rawToken, expiresAtUtc);

    public static RefreshRotationResult Invalid() => new(RefreshOutcome.Invalid);

    public static RefreshRotationResult Expired() => new(RefreshOutcome.Expired);

    public static RefreshRotationResult ReuseDetected(Guid userId) => new(RefreshOutcome.ReuseDetected, userId);
}
