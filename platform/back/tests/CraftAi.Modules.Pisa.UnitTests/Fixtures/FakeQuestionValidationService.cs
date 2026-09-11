using System.Text.Json;
using CraftAi.Modules.Assessment.Contracts;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Pisa.UnitTests.Fixtures;

/// <summary>
/// Заглушка <see cref="IQuestionValidationService"/> — Pisa-тесты проверяют оркестрацию
/// (валидация метаданных, отказ от записи), а не саму структурную валидацию 8 типов
/// вопросов: та уже покрыта CraftAi.Modules.Assessment.UnitTests.
/// </summary>
public sealed class FakeQuestionValidationService : IQuestionValidationService
{
    public Result NextResult { get; set; } = Result.Success();

    public Result Validate(QuestionType type, JsonElement payload, JsonElement answerKey) => NextResult;
}
