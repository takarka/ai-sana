using CraftAi.Modules.Assessment.Contracts;

namespace CraftAi.Modules.Pisa.Domain;

/// <summary>
/// Один вопрос составного задания — из общего набора типов (план 09 §3.5). Задание
/// содержит несколько вопросов разных форматов (FR-PSA-05), поэтому, в отличие от
/// <c>content.question</c> (1:1 с шагом), здесь 1:много с позицией.
/// </summary>
public sealed class ItemQuestion
{
    public Guid Id { get; init; }

    public required Guid ItemId { get; init; }

    public int Position { get; set; }

    public required QuestionType Type { get; init; }

    public required string Payload { get; set; }

    public required string AnswerKey { get; set; }
}
