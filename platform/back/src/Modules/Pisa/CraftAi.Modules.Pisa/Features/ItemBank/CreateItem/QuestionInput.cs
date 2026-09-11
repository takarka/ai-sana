using System.Text.Json;

namespace CraftAi.Modules.Pisa.Features.ItemBank.CreateItem;

/// <param name="QuestionType">Одно из восьми значений <see cref="CraftAi.Modules.Assessment.Contracts.QuestionType"/> — план 06 §2.</param>
public sealed record QuestionInput(string QuestionType, JsonElement Payload, JsonElement AnswerKey);
