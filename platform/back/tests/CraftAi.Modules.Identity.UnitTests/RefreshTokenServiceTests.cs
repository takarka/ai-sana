using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Persistence;
using CraftAi.Modules.Identity.Security;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace CraftAi.Modules.Identity.UnitTests;

/// <summary>
/// Ротация и погашение семьи (план 09 §3.2, A1.3) — самая рискованная логика A1,
/// проверяется напрямую на SQLite in-memory, без HTTP и без реального Postgres.
/// </summary>
public sealed class RefreshTokenServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private IdentityDbContext _db = null!;
    private FakeTimeProvider _timeProvider = null!;
    private RefreshTokenService _sut = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<IdentityDbContext>().UseSqlite(_connection).Options;
        _db = new IdentityDbContext(options);
        await _db.Database.EnsureCreatedAsync();

        _timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        _sut = new RefreshTokenService(_db, JwtOptionsWithLifetime(TimeSpan.FromDays(30)), _timeProvider);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task Rotate_СПравильнымТокеном_ВыдаётНовыйИОтзываетСтарый()
    {
        var userId = await CreateUserAsync();
        var (raw, entity) = await _sut.IssueNewFamilyAsync(userId, "ua", CancellationToken.None);

        var result = await _sut.RotateAsync(raw, "ua", CancellationToken.None);

        Assert.Equal(RefreshOutcome.Success, result.Outcome);
        Assert.Equal(userId, result.UserId);
        Assert.NotEqual(raw, result.RawToken);

        var old = await _db.RefreshTokens.SingleAsync(t => t.Id == entity.Id);
        Assert.NotNull(old.RevokedAtUtc);
        Assert.NotNull(old.ReplacedByTokenId);
    }

    [Fact]
    public async Task Rotate_ПовторноеИспользованиеОтозванного_ГаситВсюСемью()
    {
        var userId = await CreateUserAsync();
        var (raw1, _) = await _sut.IssueNewFamilyAsync(userId, "ua", CancellationToken.None);
        var rotated = await _sut.RotateAsync(raw1, "ua", CancellationToken.None);

        var reuse = await _sut.RotateAsync(raw1, "ua", CancellationToken.None);
        Assert.Equal(RefreshOutcome.ReuseDetected, reuse.Outcome);
        Assert.Equal(userId, reuse.UserId);

        // Токен, выданный ТЕМ САМЫМ (уже погашенным) rotate — тоже должен быть мёртв:
        // гасится вся семья, а не только предъявленный токен.
        var secondAttempt = await _sut.RotateAsync(rotated.RawToken!, "ua", CancellationToken.None);
        Assert.Equal(RefreshOutcome.ReuseDetected, secondAttempt.Outcome);
    }

    [Fact]
    public async Task Rotate_НеизвестныйТокен_ВозвращаетInvalid()
    {
        var result = await _sut.RotateAsync("does-not-exist", "ua", CancellationToken.None);

        Assert.Equal(RefreshOutcome.Invalid, result.Outcome);
    }

    [Fact]
    public async Task Rotate_ИстёкшийТокен_ВозвращаетExpired()
    {
        var userId = await CreateUserAsync();
        var sut = new RefreshTokenService(_db, JwtOptionsWithLifetime(TimeSpan.FromMinutes(1)), _timeProvider);
        var (raw, _) = await sut.IssueNewFamilyAsync(userId, "ua", CancellationToken.None);

        _timeProvider.Advance(TimeSpan.FromMinutes(2));

        var result = await sut.RotateAsync(raw, "ua", CancellationToken.None);

        Assert.Equal(RefreshOutcome.Expired, result.Outcome);
    }

    [Fact]
    public async Task RevokeAllForUser_ОтзываетВсеАктивныеТокеныПользователя()
    {
        var userId = await CreateUserAsync();
        await _sut.IssueNewFamilyAsync(userId, "device-1", CancellationToken.None);
        await _sut.IssueNewFamilyAsync(userId, "device-2", CancellationToken.None);

        await _sut.RevokeAllForUserAsync(userId, CancellationToken.None);

        var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId).ToListAsync();
        Assert.All(tokens, t => Assert.NotNull(t.RevokedAtUtc));
    }

    private async Task<Guid> CreateUserAsync()
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"{Guid.NewGuid():n}@test.local",
            Email = $"{Guid.NewGuid():n}@test.local",
            FullName = "Test User",
            CreatedAtUtc = _timeProvider.GetUtcNow(),
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user.Id;
    }

    private static IOptions<JwtOptions> JwtOptionsWithLifetime(TimeSpan refreshLifetime) =>
        Options.Create(new JwtOptions
        {
            Issuer = "test",
            Audience = "test",
            SigningKey = new string('k', 32),
            RefreshTokenLifetime = refreshLifetime,
        });
}
