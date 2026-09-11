namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

/// <summary>Стимул составного задания: текст/график/источники (план 09 §3.6).</summary>
public sealed record StimulusInput(string Text, string? ChartUrl, IReadOnlyList<string>? Sources);
