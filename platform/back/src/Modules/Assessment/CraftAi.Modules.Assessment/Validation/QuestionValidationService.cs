using System.Text.Json;
using CraftAi.Modules.Assessment.Contracts;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Assessment.Validation;

/// <summary>
/// Структурная валидация восьми типов заданий (план 06 §2, FR-CMS-02). Формы
/// <c>payload</c>/<c>answer_key</c> ниже — единственный источник истины для форм
/// авторинга в <c>Content</c>/<c>Pisa</c> и для проверки ответа в <c>Learning</c> позже.
/// </summary>
public sealed class QuestionValidationService : IQuestionValidationService
{
    public Result Validate(QuestionType type, JsonElement payload, JsonElement answerKey) => type switch
    {
        QuestionType.SingleChoice => ValidateSingleChoice(payload, answerKey),
        QuestionType.MultipleChoice => ValidateMultipleChoice(payload, answerKey),
        QuestionType.Matching => ValidateMatching(payload, answerKey),
        QuestionType.Ordering => ValidateOrdering(payload, answerKey),
        QuestionType.FillInBlank => ValidateFillInBlank(payload, answerKey),
        QuestionType.NumericTolerance => ValidateNumericTolerance(payload, answerKey),
        QuestionType.ShortText => ValidateShortText(payload, answerKey),
        QuestionType.DragAndDrop => ValidateDragAndDrop(payload, answerKey),
        _ => Fail($"Неизвестный тип вопроса: {type}."),
    };

    /// <summary>payload: {"options": string[≥2]}; answerKey: {"correctIndex": int}.</summary>
    private static Result ValidateSingleChoice(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetStringArray(payload, "options", out var options, minLength: 2, out var error))
        {
            return error!;
        }

        if (!TryGetInt(answerKey, "correctIndex", out var correctIndex, out error))
        {
            return error!;
        }

        return IsInRange(correctIndex, options.Count)
            ? Result.Success()
            : Fail($"correctIndex={correctIndex} вне диапазона options (0..{options.Count - 1}).");
    }

    /// <summary>payload: {"options": string[≥2]}; answerKey: {"correctIndices": int[≥1], без повторов}.</summary>
    private static Result ValidateMultipleChoice(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetStringArray(payload, "options", out var options, minLength: 2, out var error))
        {
            return error!;
        }

        if (!TryGetIntArray(answerKey, "correctIndices", out var indices, minLength: 1, out error))
        {
            return error!;
        }

        if (indices.Distinct().Count() != indices.Count)
        {
            return Fail("correctIndices содержит повторяющиеся индексы.");
        }

        return indices.All(i => IsInRange(i, options.Count))
            ? Result.Success()
            : Fail($"correctIndices содержит индекс вне диапазона options (0..{options.Count - 1}).");
    }

    /// <summary>
    /// payload: {"left": string[≥2], "right": string[≥2]}; answerKey:
    /// {"pairs": [[leftIndex,rightIndex], ...]} — каждый leftIndex ровно один раз.
    /// </summary>
    private static Result ValidateMatching(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetStringArray(payload, "left", out var left, minLength: 2, out var error))
        {
            return error!;
        }

        if (!TryGetStringArray(payload, "right", out var right, minLength: 2, out error))
        {
            return error!;
        }

        if (!TryGetPairArray(answerKey, "pairs", out var pairs, out error))
        {
            return error!;
        }

        if (pairs.Count != left.Count)
        {
            return Fail($"pairs должен содержать ровно {left.Count} соответствий (по числу left).");
        }

        var leftIndices = pairs.Select(p => p.Left).ToList();
        if (leftIndices.Distinct().Count() != leftIndices.Count || !leftIndices.All(i => IsInRange(i, left.Count)))
        {
            return Fail("pairs должен покрывать каждый индекс left ровно один раз.");
        }

        return pairs.All(p => IsInRange(p.Right, right.Count))
            ? Result.Success()
            : Fail($"pairs содержит индекс right вне диапазона (0..{right.Count - 1}).");
    }

    /// <summary>payload: {"items": string[≥2]}; answerKey: {"order": int[]} — перестановка индексов items.</summary>
    private static Result ValidateOrdering(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetStringArray(payload, "items", out var items, minLength: 2, out var error))
        {
            return error!;
        }

        if (!TryGetIntArray(answerKey, "order", out var order, minLength: 2, out error))
        {
            return error!;
        }

        return IsPermutation(order, items.Count)
            ? Result.Success()
            : Fail($"order должен быть перестановкой индексов 0..{items.Count - 1}.");
    }

    /// <summary>payload: {"text": string}; answerKey: {"blanks": string[≥1]} — эталонный ответ на каждый пропуск.</summary>
    private static Result ValidateFillInBlank(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetNonEmptyString(payload, "text", out _, out var error))
        {
            return error!;
        }

        return TryGetStringArray(answerKey, "blanks", out _, minLength: 1, out error) ? Result.Success() : error!;
    }

    /// <summary>payload: {"question": string}; answerKey: {"expected": number, "tolerance": number≥0}.</summary>
    private static Result ValidateNumericTolerance(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetNonEmptyString(payload, "question", out _, out var error))
        {
            return error!;
        }

        if (!TryGetProperty(answerKey, "expected", JsonValueKind.Number, out _, out error))
        {
            return error!;
        }

        if (!TryGetProperty(answerKey, "tolerance", JsonValueKind.Number, out var toleranceElement, out error))
        {
            return error!;
        }

        return toleranceElement.GetDouble() >= 0
            ? Result.Success()
            : Fail("tolerance не может быть отрицательным.");
    }

    /// <summary>payload: {"question": string}; answerKey: {"acceptedAnswers": string[≥1]}.</summary>
    private static Result ValidateShortText(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetNonEmptyString(payload, "question", out _, out var error))
        {
            return error!;
        }

        return TryGetStringArray(answerKey, "acceptedAnswers", out _, minLength: 1, out error) ? Result.Success() : error!;
    }

    /// <summary>
    /// payload: {"items": string[≥1], "categories": string[≥2]}; answerKey:
    /// {"assignments": [[itemIndex,categoryIndex], ...]} — каждый itemIndex ровно один раз.
    /// </summary>
    private static Result ValidateDragAndDrop(JsonElement payload, JsonElement answerKey)
    {
        if (!TryGetStringArray(payload, "items", out var items, minLength: 1, out var error))
        {
            return error!;
        }

        if (!TryGetStringArray(payload, "categories", out var categories, minLength: 2, out error))
        {
            return error!;
        }

        if (!TryGetPairArray(answerKey, "assignments", out var assignments, out error))
        {
            return error!;
        }

        if (assignments.Count != items.Count)
        {
            return Fail($"assignments должен содержать ровно {items.Count} записей (по числу items).");
        }

        var itemIndices = assignments.Select(a => a.Left).ToList();
        if (itemIndices.Distinct().Count() != itemIndices.Count || !itemIndices.All(i => IsInRange(i, items.Count)))
        {
            return Fail("assignments должен покрывать каждый индекс items ровно один раз.");
        }

        return assignments.All(a => IsInRange(a.Right, categories.Count))
            ? Result.Success()
            : Fail($"assignments содержит индекс category вне диапазона (0..{categories.Count - 1}).");
    }

    private static bool IsInRange(int index, int length) => index >= 0 && index < length;

    private static bool IsPermutation(IReadOnlyList<int> values, int length) =>
        values.Count == length && values.Distinct().Count() == length && values.All(v => IsInRange(v, length));

    private static Result Fail(string message) => Result.Failure(Error.Validation("question.invalid-structure", message));

    private static bool TryGetProperty(
        JsonElement obj, string name, JsonValueKind expectedKind, out JsonElement value, out Result? error)
    {
        if (obj.ValueKind != JsonValueKind.Object || !obj.TryGetProperty(name, out value)
            || value.ValueKind != expectedKind)
        {
            error = Fail($"Поле «{name}» обязательно и должно быть типа {expectedKind}.");
            value = default;
            return false;
        }

        error = null;
        return true;
    }

    private static bool TryGetInt(JsonElement obj, string name, out int value, out Result? error)
    {
        if (!TryGetProperty(obj, name, JsonValueKind.Number, out var element, out error) || !element.TryGetInt32(out value))
        {
            error ??= Fail($"Поле «{name}» должно быть целым числом.");
            value = default;
            return false;
        }

        return true;
    }

    private static bool TryGetNonEmptyString(JsonElement obj, string name, out string value, out Result? error)
    {
        if (!TryGetProperty(obj, name, JsonValueKind.String, out var element, out error)
            || string.IsNullOrWhiteSpace(element.GetString()))
        {
            error = Fail($"Поле «{name}» обязательно и не может быть пустым.");
            value = string.Empty;
            return false;
        }

        value = element.GetString()!;
        return true;
    }

    private static bool TryGetStringArray(
        JsonElement obj, string name, out IReadOnlyList<string> values, int minLength, out Result? error)
    {
        if (!TryGetProperty(obj, name, JsonValueKind.Array, out var array, out error))
        {
            values = [];
            return false;
        }

        var items = array.EnumerateArray().ToList();
        if (items.Count < minLength || items.Any(i => i.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(i.GetString())))
        {
            error = Fail($"Поле «{name}» должно быть массивом непустых строк (минимум {minLength}).");
            values = [];
            return false;
        }

        values = [.. items.Select(i => i.GetString()!)];
        error = null;
        return true;
    }

    private static bool TryGetIntArray(
        JsonElement obj, string name, out IReadOnlyList<int> values, int minLength, out Result? error)
    {
        if (!TryGetProperty(obj, name, JsonValueKind.Array, out var array, out error))
        {
            values = [];
            return false;
        }

        var items = array.EnumerateArray().ToList();
        if (items.Count < minLength || items.Any(i => i.ValueKind != JsonValueKind.Number || !i.TryGetInt32(out _)))
        {
            error = Fail($"Поле «{name}» должно быть массивом целых чисел (минимум {minLength}).");
            values = [];
            return false;
        }

        values = [.. items.Select(i => i.GetInt32())];
        error = null;
        return true;
    }

    /// <summary>Массив пар <c>[int,int]</c>, например <c>[[0,2],[1,0]]</c>.</summary>
    private static bool TryGetPairArray(
        JsonElement obj, string name, out IReadOnlyList<(int Left, int Right)> pairs, out Result? error)
    {
        if (!TryGetProperty(obj, name, JsonValueKind.Array, out var array, out error))
        {
            pairs = [];
            return false;
        }

        var result = new List<(int, int)>();
        foreach (var item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Array || item.GetArrayLength() != 2)
            {
                error = Fail($"Поле «{name}» должно быть массивом пар [int,int].");
                pairs = [];
                return false;
            }

            var elements = item.EnumerateArray().ToList();
            if (elements[0].ValueKind != JsonValueKind.Number || !elements[0].TryGetInt32(out var left)
                || elements[1].ValueKind != JsonValueKind.Number || !elements[1].TryGetInt32(out var right))
            {
                error = Fail($"Поле «{name}» должно быть массивом пар целых чисел.");
                pairs = [];
                return false;
            }

            result.Add((left, right));
        }

        pairs = result;
        error = null;
        return true;
    }
}
