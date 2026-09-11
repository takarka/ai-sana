using CraftAi.Modules.Assessment.Contracts;

namespace CraftAi.Modules.Content.Domain;

/// <summary>
/// Задание шага <see cref="LessonStepType.Task"/> — один вопрос на шаг в v0. Структура
/// <see cref="Payload"/>/<see cref="AnswerKey"/> проверена
/// <see cref="IQuestionValidationService"/> (план 09 §3.5) на момент сохранения.
/// </summary>
public sealed class Question
{
    public Guid Id { get; init; }

    public required Guid LessonStepId { get; init; }

    public required QuestionType Type { get; init; }

    /// <summary>Сериализованный JSON — форма зависит от <see cref="Type"/> (jsonb).</summary>
    public required string Payload { get; set; }

    /// <summary>Сериализованный JSON — форма зависит от <see cref="Type"/> (jsonb).</summary>
    public required string AnswerKey { get; set; }
}
