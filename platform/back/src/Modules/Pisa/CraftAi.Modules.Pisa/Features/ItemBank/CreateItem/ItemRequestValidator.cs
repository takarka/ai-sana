using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Pisa.Domain;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

/// <summary>
/// Общая проверка полей задания для CreateItem и UpdateItem — план 09 §3.6. Структуру
/// каждого вопроса при этом проверяет <see cref="IQuestionValidationService"/> (план 09 §3.5) —
/// здесь только метаданные и то, что вопросов хотя бы один (FR-PSA-05).
/// </summary>
internal static class ItemRequestValidator
{
    public static Result<ItemDirection> Validate(
        string stimulusText, string direction, int level, int expectedTimeMinutes,
        int gradeRangeMin, int gradeRangeMax, int questionCount)
    {
        if (string.IsNullOrWhiteSpace(stimulusText))
        {
            return Result.Failure<ItemDirection>(Error.Validation("item.stimulus-text-required", "Текст стимула обязателен."));
        }

        if (!Enum.TryParse<ItemDirection>(direction, ignoreCase: true, out var parsedDirection))
        {
            return Result.Failure<ItemDirection>(Error.Validation(
                "item.invalid-direction", $"Направление «{direction}» не распознано — допустимы math/science/reading."));
        }

        if (level is < 1 or > 6)
        {
            return Result.Failure<ItemDirection>(Error.Validation("item.invalid-level", "Уровень должен быть от 1 до 6."));
        }

        if (expectedTimeMinutes <= 0)
        {
            return Result.Failure<ItemDirection>(
                Error.Validation("item.invalid-expected-time", "Время выполнения должно быть положительным."));
        }

        if (gradeRangeMin is < 1 or > 11 || gradeRangeMax is < 1 or > 11 || gradeRangeMin > gradeRangeMax)
        {
            return Result.Failure<ItemDirection>(Error.Validation(
                "item.invalid-grade-range", "Диапазон параллелей должен быть внутри 1..11 и min ≤ max."));
        }

        if (questionCount == 0)
        {
            return Result.Failure<ItemDirection>(
                Error.Validation("item.questions-required", "Составное задание должно содержать хотя бы один вопрос."));
        }

        return Result.Success(parsedDirection);
    }
}
