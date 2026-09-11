using CraftAi.Modules.Assessment.Contracts;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

public sealed record ParsedQuestion(QuestionType Type, System.Text.Json.JsonElement Payload, System.Text.Json.JsonElement AnswerKey);

/// <summary>
/// Разбор и структурная проверка каждого вопроса составного задания через
/// <see cref="IQuestionValidationService"/> (план 09 §3.5) — до первой ошибки, ничего не
/// сохраняя (та же гарантия, что у <c>Content.AddTaskStep</c>).
/// </summary>
internal static class QuestionInputsValidator
{
    public static Result<IReadOnlyList<ParsedQuestion>> Validate(
        IReadOnlyList<QuestionInput> questions, IQuestionValidationService validation)
    {
        var parsed = new List<ParsedQuestion>(questions.Count);

        for (var i = 0; i < questions.Count; i++)
        {
            var input = questions[i];

            if (!Enum.TryParse<QuestionType>(input.QuestionType, ignoreCase: true, out var type))
            {
                return Result.Failure<IReadOnlyList<ParsedQuestion>>(Error.Validation(
                    "item.invalid-question-type", $"Вопрос {i + 1}: тип «{input.QuestionType}» не распознан."));
            }

            var result = validation.Validate(type, input.Payload, input.AnswerKey);
            if (result.IsFailure)
            {
                return Result.Failure<IReadOnlyList<ParsedQuestion>>(
                    Error.Validation(result.Error!.Code, $"Вопрос {i + 1}: {result.Error!.Message}"));
            }

            parsed.Add(new ParsedQuestion(type, input.Payload, input.AnswerKey));
        }

        return Result.Success<IReadOnlyList<ParsedQuestion>>(parsed);
    }
}
