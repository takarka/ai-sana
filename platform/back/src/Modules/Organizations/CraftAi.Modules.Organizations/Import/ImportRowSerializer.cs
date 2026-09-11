using System.Text.Json;
using System.Text.Json.Serialization;

namespace CraftAi.Modules.Organizations.Import;

/// <summary>Сериализация <see cref="ImportRow"/> в <c>UserImportBatch.PreviewJson</c> (план 09 §3.3, A2.6).</summary>
public static class ImportRowSerializer
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public static string Serialize(IReadOnlyList<ImportRow> rows) => JsonSerializer.Serialize(rows, Options);

    public static IReadOnlyList<ImportRow> Deserialize(string json) =>
        JsonSerializer.Deserialize<IReadOnlyList<ImportRow>>(json, Options) ?? [];
}
