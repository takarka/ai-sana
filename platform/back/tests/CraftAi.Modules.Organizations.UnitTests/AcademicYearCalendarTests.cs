using CraftAi.Modules.Organizations.Domain;

namespace CraftAi.Modules.Organizations.UnitTests;

public sealed class AcademicYearCalendarTests
{
    [Theory]
    [InlineData("2026-09-11", 2026, "2026/2027")]
    [InlineData("2026-09-01", 2026, "2026/2027")]
    [InlineData("2026-08-31", 2025, "2025/2026")]
    [InlineData("2026-03-01", 2025, "2025/2026")]
    public void CurrentFor_ОпределяетГодПоГраницеСентября(string nowText, int expectedStartYear, string expectedName)
    {
        var now = DateTimeOffset.Parse(nowText + "T00:00:00Z");

        var (startsOn, endsOn, name) = AcademicYearCalendar.CurrentFor(now);

        Assert.Equal(new DateOnly(expectedStartYear, 9, 1), startsOn);
        Assert.Equal(new DateOnly(expectedStartYear + 1, 5, 31), endsOn);
        Assert.Equal(expectedName, name);
    }
}
