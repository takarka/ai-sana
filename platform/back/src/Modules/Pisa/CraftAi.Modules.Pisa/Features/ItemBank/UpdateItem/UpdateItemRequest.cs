using CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

namespace CraftAi.Modules.Pisa.Features.ItemBank.UpdateItem;

/// <summary>Те же поля, что CreateItem — вопросы задания заменяются целиком.</summary>
public sealed record UpdateItemRequest(
    StimulusInput Stimulus,
    string Direction,
    string CognitiveProcess,
    string Context,
    int Level,
    int ExpectedTimeMinutes,
    int GradeRangeMin,
    int GradeRangeMax,
    IReadOnlyList<QuestionInput> Questions);
