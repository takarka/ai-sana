using ClosedXML.Excel;
using CraftAi.Modules.Organizations.Domain;
using CraftAi.Modules.Organizations.Import;

namespace CraftAi.Modules.Organizations.UnitTests;

/// <summary>Разбор XLSX (план 09 §3.3, A2.5) — самая рискованная логика A2 наравне с дедупом.</summary>
public sealed class XlsxUserImportParserTests
{
    [Fact]
    public void Parse_ВалидныйФайл_ВозвращаетСтрокиСоCreate()
    {
        using var stream = BuildWorkbook(
            ["ФИО", "ИИН", "Класс", "Роль"],
            ["Иванов Иван Иванович", "123456789012", "7А", "ученик"],
            ["Петрова Анна Сергеевна", "987654321098", "", "учитель"]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);

        var student = result.Value[0];
        Assert.Equal(ImportRowOutcome.Create, student.Outcome);
        Assert.Equal(OrganizationMemberRole.Student, student.Role);
        Assert.Equal(7, student.Grade);
        Assert.Equal("А", student.Letter);
        Assert.Equal("Иванов Иван Иванович", student.FullName);
        Assert.Equal("123456789012", student.ExternalId);

        var teacher = result.Value[1];
        Assert.Equal(ImportRowOutcome.Create, teacher.Outcome);
        Assert.Equal(OrganizationMemberRole.Teacher, teacher.Role);
        Assert.Null(teacher.Grade);
    }

    [Fact]
    public void Parse_НормализуетФИОиИИН()
    {
        using var stream = BuildWorkbook(
            ["ФИО", "ИИН", "Класс", "Роль"],
            ["  Иванов   Иван   Иванович  ", "123 456-789 012", "7а", "ученик"]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsSuccess);
        Assert.Equal("Иванов Иван Иванович", result.Value[0].FullName);
        Assert.Equal("123456789012", result.Value[0].ExternalId);
        Assert.Equal("А", result.Value[0].Letter);
    }

    [Fact]
    public void Parse_БезФИО_Ошибка()
    {
        using var stream = BuildWorkbook(["ФИО", "ИИН", "Класс"], ["", "123456789012", "7А"]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsSuccess);
        Assert.Equal(ImportRowOutcome.Error, result.Value[0].Outcome);
        Assert.Contains("ФИО", result.Value[0].Reason);
    }

    [Fact]
    public void Parse_НераспознанныйКласс_Ошибка()
    {
        using var stream = BuildWorkbook(["ФИО", "ИИН", "Класс"], ["Иванов Иван", "123456789012", "непонятно"]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsSuccess);
        Assert.Equal(ImportRowOutcome.Error, result.Value[0].Outcome);
    }

    [Fact]
    public void Parse_НевернаяРоль_Ошибка()
    {
        using var stream = BuildWorkbook(["ФИО", "ИИН", "Класс", "Роль"], ["Иванов Иван", "123456789012", "7А", "директор"]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsSuccess);
        Assert.Equal(ImportRowOutcome.Error, result.Value[0].Outcome);
    }

    [Fact]
    public void Parse_БезОбязательныхКолонок_ВозвращаетFailure()
    {
        using var stream = BuildWorkbook(["Имя"], ["Иванов Иван"]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsFailure);
        Assert.Equal("import.missing-columns", result.Error!.Code);
    }

    [Fact]
    public void Parse_БольшеЛимитаСтрок_ВозвращаетFailure()
    {
        var rows = Enumerable.Range(0, ImportLimits.MaxRows + 1)
            .Select(i => new[] { $"Ученик {i}", $"{100000000000 + i}", "7А", "ученик" });
        using var stream = BuildWorkbook(["ФИО", "ИИН", "Класс", "Роль"], [.. rows]);

        var result = XlsxUserImportParser.Parse(stream);

        Assert.True(result.IsFailure);
        Assert.Equal("import.too-many-rows", result.Error!.Code);
    }

    private static MemoryStream BuildWorkbook(string[] headers, params string[][] rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Sheet1");

        for (var col = 0; col < headers.Length; col++)
        {
            sheet.Cell(1, col + 1).Value = headers[col];
        }

        for (var row = 0; row < rows.Length; row++)
        {
            for (var col = 0; col < rows[row].Length; col++)
            {
                sheet.Cell(row + 2, col + 1).Value = rows[row][col];
            }
        }

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
}
