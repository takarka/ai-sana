using System.Globalization;
using System.Text;
using ClosedXML.Excel;
using CraftAi.Modules.Organizations.Domain;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Organizations.Import;

/// <summary>
/// Разбор XLSX в построчные <see cref="ImportRow"/> (план 09 §3.3, A2.5). Проверяет только то,
/// что видно из самого файла — существование класса и дубли по внешнему идентификатору
/// разрешает вызывающий код, у которого есть доступ к БД (см. <c>PreviewImportHandler</c>).
/// Ожидаемые колонки первой строки (регистр не важен): «ФИО», «ИИН», «Класс», «Роль» (необязательна,
/// по умолчанию — ученик).
/// </summary>
public static class XlsxUserImportParser
{
    private const string FullNameHeader = "фио";
    private const string ExternalIdHeader = "иин";
    private const string ClassHeader = "класс";
    private const string RoleHeader = "роль";

    public static Result<IReadOnlyList<ImportRow>> Parse(Stream xlsx)
    {
        using var workbook = new XLWorkbook(xlsx);
        var sheet = workbook.Worksheets.First();
        var headerRow = sheet.Row(1);

        var columns = new Dictionary<string, int>();
        foreach (var cell in headerRow.CellsUsed())
        {
            columns[cell.GetString().Trim().ToLowerInvariant()] = cell.Address.ColumnNumber;
        }

        if (!columns.ContainsKey(FullNameHeader) || !columns.ContainsKey(ExternalIdHeader))
        {
            return Result.Failure<IReadOnlyList<ImportRow>>(Error.Validation(
                "import.missing-columns", "В файле обязательны колонки «ФИО» и «ИИН»."));
        }

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        var dataRowCount = Math.Max(0, lastRow - 1);
        if (dataRowCount > ImportLimits.MaxRows)
        {
            return Result.Failure<IReadOnlyList<ImportRow>>(Error.Validation(
                "import.too-many-rows", $"В файле {dataRowCount} строк — лимит {ImportLimits.MaxRows}."));
        }

        var rows = new List<ImportRow>();
        for (var rowNumber = 2; rowNumber <= lastRow; rowNumber++)
        {
            var row = sheet.Row(rowNumber);
            if (row.IsEmpty())
            {
                continue;
            }

            rows.Add(ParseRow(row, rowNumber, columns));
        }

        return Result.Success<IReadOnlyList<ImportRow>>(rows);
    }

    private static ImportRow ParseRow(IXLRow row, int rowNumber, IReadOnlyDictionary<string, int> columns)
    {
        var fullName = NormalizeFullName(GetCell(row, columns, FullNameHeader));
        var externalId = NormalizeExternalId(GetCell(row, columns, ExternalIdHeader));
        var roleText = GetCell(row, columns, RoleHeader);

        if (string.IsNullOrEmpty(fullName))
        {
            return new ImportRow(rowNumber, fullName, externalId, null, null, null, ImportRowOutcome.Error, "ФИО обязательно.");
        }

        if (string.IsNullOrEmpty(externalId))
        {
            return new ImportRow(rowNumber, fullName, externalId, null, null, null, ImportRowOutcome.Error, "ИИН обязателен.");
        }

        var role = ParseRole(roleText);
        if (role is null)
        {
            return new ImportRow(
                rowNumber, fullName, externalId, null, null, null, ImportRowOutcome.Error,
                $"Роль «{roleText}» не распознана — допустимы «ученик»/«учитель».");
        }

        if (role == OrganizationMemberRole.Teacher)
        {
            return new ImportRow(rowNumber, fullName, externalId, role, null, null, ImportRowOutcome.Create, null);
        }

        var classText = GetCell(row, columns, ClassHeader);
        var (grade, letter) = ParseClass(classText);
        if (grade is null || letter is null)
        {
            return new ImportRow(
                rowNumber, fullName, externalId, role, null, null, ImportRowOutcome.Error,
                $"Класс «{classText}» не распознан — ожидается формат «7А».");
        }

        return new ImportRow(rowNumber, fullName, externalId, role, grade, letter, ImportRowOutcome.Create, null);
    }

    private static string GetCell(IXLRow row, IReadOnlyDictionary<string, int> columns, string header) =>
        columns.TryGetValue(header, out var columnNumber) ? row.Cell(columnNumber).GetString().Trim() : string.Empty;

    private static string NormalizeFullName(string raw)
    {
        var collapsed = string.Join(' ', raw.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return collapsed;
    }

    private static string NormalizeExternalId(string raw)
    {
        var builder = new StringBuilder(raw.Length);
        foreach (var c in raw)
        {
            if (!char.IsWhiteSpace(c) && c != '-')
            {
                builder.Append(c);
            }
        }

        return builder.ToString();
    }

    private static OrganizationMemberRole? ParseRole(string raw) => raw.Trim().ToLowerInvariant() switch
    {
        "" => OrganizationMemberRole.Student,
        "ученик" or "student" => OrganizationMemberRole.Student,
        "учитель" or "teacher" => OrganizationMemberRole.Teacher,
        _ => null,
    };

    private static (int? Grade, string? Letter) ParseClass(string raw)
    {
        var trimmed = raw.Trim();
        var digitsLength = 0;
        while (digitsLength < trimmed.Length && char.IsAsciiDigit(trimmed[digitsLength]))
        {
            digitsLength++;
        }

        var letter = trimmed[digitsLength..].Trim().ToUpperInvariant();
        if (digitsLength == 0 || letter.Length == 0)
        {
            return (null, null);
        }

        if (!int.TryParse(trimmed[..digitsLength], NumberStyles.None, CultureInfo.InvariantCulture, out var grade)
            || grade is < 1 or > 11)
        {
            return (null, null);
        }

        return (grade, letter);
    }
}
