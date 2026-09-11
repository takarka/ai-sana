namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

/// <param name="Direction">"math" | "science" | "reading" (FR-PSA-02).</param>
/// <param name="Level">Уровень по шкале PISA, 1…6.</param>
/// <param name="GradeRangeMin">Нижняя граница параллели, которой подходит задание, 1…11 (план 07 О3).</param>
/// <param name="GradeRangeMax">Верхняя граница параллели, 1…11.</param>
/// <param name="Questions">Один стимул — несколько вопросов разных форматов (FR-PSA-05), минимум один.</param>
public sealed record CreateItemRequest(
    StimulusInput Stimulus,
    string Direction,
    string CognitiveProcess,
    string Context,
    int Level,
    int ExpectedTimeMinutes,
    int GradeRangeMin,
    int GradeRangeMax,
    IReadOnlyList<QuestionInput> Questions);
