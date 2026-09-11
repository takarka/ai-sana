using System.Security.Cryptography;
using System.Text;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CraftAi.Modules.Identity.Security;

/// <summary>
/// Выдача и ротация refresh-токенов (план 09 §3.2, A1.3). Хранится только SHA-256
/// сырого значения — так же, как пароли; предъявленное значение сравнивается по хешу.
/// </summary>
public sealed class RefreshTokenService(IdentityDbContext db, IOptions<JwtOptions> options, TimeProvider timeProvider)
{
    private const int TokenBytesLength = 64;

    /// <summary>Новый токен новой семьи — вызывается только из логина.</summary>
    public Task<(string RawToken, RefreshToken Entity)> IssueNewFamilyAsync(
        Guid userId, string? deviceInfo, CancellationToken cancellationToken) =>
        IssueAsync(userId, Guid.NewGuid(), deviceInfo, cancellationToken);

    /// <summary>
    /// Проверяет предъявленный refresh-токен и либо ротирует его (выдаёт следующий в той
    /// же семье), либо гасит всю семью, если токен уже был отозван (реюз — угон).
    /// </summary>
    public async Task<RefreshRotationResult> RotateAsync(
        string rawToken, string? deviceInfo, CancellationToken cancellationToken)
    {
        var hash = Hash(rawToken);
        var existing = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (existing is null)
        {
            return RefreshRotationResult.Invalid();
        }

        if (existing.RevokedAtUtc is not null)
        {
            await RevokeFamilyAsync(existing.FamilyId, cancellationToken);
            return RefreshRotationResult.ReuseDetected(existing.UserId);
        }

        if (existing.ExpiresAtUtc <= timeProvider.GetUtcNow())
        {
            return RefreshRotationResult.Expired();
        }

        var (rawNew, newEntity) = await IssueAsync(existing.UserId, existing.FamilyId, deviceInfo, cancellationToken);
        existing.RevokedAtUtc = timeProvider.GetUtcNow();
        existing.ReplacedByTokenId = newEntity.Id;
        await db.SaveChangesAsync(cancellationToken);

        return RefreshRotationResult.Success(existing.UserId, rawNew, newEntity.ExpiresAtUtc);
    }

    /// <summary>Логаут — гасит всю семью предъявленного токена, а не только его самого.</summary>
    public async Task<Guid?> RevokeByRawTokenAsync(string rawToken, CancellationToken cancellationToken)
    {
        var hash = Hash(rawToken);
        var existing = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        await RevokeFamilyAsync(existing.FamilyId, cancellationToken);
        return existing.UserId;
    }

    /// <summary>Смена пароля обязана обесточить все текущие сессии пользователя (API-02).</summary>
    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var tokens = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        var now = timeProvider.GetUtcNow();
        foreach (var token in tokens)
        {
            token.RevokedAtUtc = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task RevokeFamilyAsync(Guid familyId, CancellationToken cancellationToken)
    {
        var tokens = await db.RefreshTokens
            .Where(t => t.FamilyId == familyId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        var now = timeProvider.GetUtcNow();
        foreach (var token in tokens)
        {
            token.RevokedAtUtc = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<(string RawToken, RefreshToken Entity)> IssueAsync(
        Guid userId, Guid familyId, string? deviceInfo, CancellationToken cancellationToken)
    {
        var raw = GenerateRawToken();
        var now = timeProvider.GetUtcNow();

        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FamilyId = familyId,
            TokenHash = Hash(raw),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(options.Value.RefreshTokenLifetime),
            DeviceInfo = deviceInfo,
        };

        db.RefreshTokens.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return (raw, entity);
    }

    private static string GenerateRawToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(TokenBytesLength));

    private static string Hash(string raw) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
}
