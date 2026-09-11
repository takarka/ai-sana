namespace CraftAi.Modules.Organizations.Domain;

/// <summary>
/// Учебный год казахстанской школы: 1 сентября — 31 мая. Используется, чтобы завести
/// текущий <see cref="AcademicYear"/> автоматически вместе со школой (план 09 §3.3, A2.2) —
/// отдельного экрана выбора дат в v0 нет (план 08 §4).
/// </summary>
public static class AcademicYearCalendar
{
    public static (DateOnly StartsOn, DateOnly EndsOn, string Name) CurrentFor(DateTimeOffset nowUtc)
    {
        var startYear = nowUtc.Month >= 9 ? nowUtc.Year : nowUtc.Year - 1;
        var startsOn = new DateOnly(startYear, 9, 1);
        var endsOn = new DateOnly(startYear + 1, 5, 31);
        return (startsOn, endsOn, $"{startYear}/{startYear + 1}");
    }
}
