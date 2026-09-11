using System.Text.Json;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

/// <summary>
/// Сериализация <see cref="StimulusInput"/> в <c>item.stimulus</c> (jsonb) — camelCase, чтобы
/// вложенный JSON в ответе API выглядел так же, как остальной ответ (сериализация
/// Minimal API по умолчанию — camelCase).
/// </summary>
internal static class PisaJson
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(StimulusInput input) => JsonSerializer.Serialize(input, Options);

    public static JsonElement Parse(string json) => JsonDocument.Parse(json).RootElement;
}
