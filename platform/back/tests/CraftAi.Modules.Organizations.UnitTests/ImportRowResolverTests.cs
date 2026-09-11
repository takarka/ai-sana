using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Import;
using CraftAi.Modules.Organizations.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.UnitTests;

/// <summary>
/// Дедуп по внешнему идентификатору и проверка существования класса (план 09 §3.3, A2.6) —
/// то, что решает исход предпросмотра и что не видно из самого файла.
/// </summary>
public sealed class ImportRowResolverTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private OrganizationsDbContext _db = null!;
    private Guid _organizationId;
    private Guid _academicYearId;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        // UseSnakeCaseNamingConvention обязателен: OrganizationsDbContext задаёт HasFilter на
        // уникальном индексе сырой SQL-строкой ("external_id IS NOT NULL") — без конвенции
        // реальное имя колонки останется PascalCase, и фильтр индекса не соберётся.
        var options = new DbContextOptionsBuilder<OrganizationsDbContext>()
            .UseSqlite(_connection)
            .UseSnakeCaseNamingConvention()
            .Options;
        _db = new OrganizationsDbContext(options);
        await _db.Database.EnsureCreatedAsync();

        _organizationId = Guid.NewGuid();
        _academicYearId = Guid.NewGuid();

        _db.Organizations.Add(new Organization { Id = _organizationId, Name = "Школа №1", CreatedAtUtc = DateTimeOffset.UtcNow });
        _db.AcademicYears.Add(new AcademicYear
        {
            Id = _academicYearId,
            OrganizationId = _organizationId,
            Name = "2026/2027",
            StartsOn = new DateOnly(2026, 9, 1),
            EndsOn = new DateOnly(2027, 5, 31),
        });
        _db.ClassGroups.Add(new ClassGroup
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            AcademicYearId = _academicYearId,
            Grade = 7,
            Letter = "А",
        });
        _db.OrganizationMembers.Add(new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = Guid.NewGuid(),
            Role = OrganizationMemberRole.Student,
            ExternalId = "111111111111",
            CreatedAtUtc = DateTimeOffset.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task ResolveAsync_СуществующийВнешнийИдентификатор_SkipDuplicate()
    {
        var rows = new[] { StudentRow(1, "111111111111", 7, "А") };

        var resolved = await ImportRowResolver.ResolveAsync(rows, _organizationId, _academicYearId, _db, CancellationToken.None);

        Assert.Equal(ImportRowOutcome.SkipDuplicate, resolved[0].Outcome);
    }

    [Fact]
    public async Task ResolveAsync_ПовторВнутриФайла_ВтораяСтрокаОшибка()
    {
        var rows = new[]
        {
            StudentRow(1, "222222222222", 7, "А"),
            StudentRow(2, "222222222222", 7, "А"),
        };

        var resolved = await ImportRowResolver.ResolveAsync(rows, _organizationId, _academicYearId, _db, CancellationToken.None);

        Assert.Equal(ImportRowOutcome.Create, resolved[0].Outcome);
        Assert.Equal(ImportRowOutcome.Error, resolved[1].Outcome);
    }

    [Fact]
    public async Task ResolveAsync_КлассНеСуществует_Ошибка()
    {
        var rows = new[] { StudentRow(1, "333333333333", 9, "Я") };

        var resolved = await ImportRowResolver.ResolveAsync(rows, _organizationId, _academicYearId, _db, CancellationToken.None);

        Assert.Equal(ImportRowOutcome.Error, resolved[0].Outcome);
        Assert.Contains("не найден", resolved[0].Reason);
    }

    [Fact]
    public async Task ResolveAsync_ВалидныйУченик_ЗаполняетClassGroupId()
    {
        var rows = new[] { StudentRow(1, "444444444444", 7, "А") };

        var resolved = await ImportRowResolver.ResolveAsync(rows, _organizationId, _academicYearId, _db, CancellationToken.None);

        Assert.Equal(ImportRowOutcome.Create, resolved[0].Outcome);
        Assert.NotNull(resolved[0].ClassGroupId);
    }

    [Fact]
    public async Task ResolveAsync_Учитель_НеТребуетКласс()
    {
        var rows = new[] { new ImportRow(1, "Учитель Тестов", "555555555555", OrganizationMemberRole.Teacher, null, null, ImportRowOutcome.Create, null) };

        var resolved = await ImportRowResolver.ResolveAsync(rows, _organizationId, _academicYearId, _db, CancellationToken.None);

        Assert.Equal(ImportRowOutcome.Create, resolved[0].Outcome);
        Assert.Null(resolved[0].ClassGroupId);
    }

    private static ImportRow StudentRow(int rowNumber, string externalId, int grade, string letter) =>
        new(rowNumber, "Ученик Тестов", externalId, OrganizationMemberRole.Student, grade, letter, ImportRowOutcome.Create, null);
}
