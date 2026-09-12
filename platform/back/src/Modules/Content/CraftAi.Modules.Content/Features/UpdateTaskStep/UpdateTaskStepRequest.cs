using System.Text.Json;

namespace CraftAi.Modules.Content.Features.UpdateTaskStep;

/// <param name="QuestionType">Одно из восьми значений <see cref="CraftAi.Modules.Assessment.Contracts.QuestionType"/> — план 06 §2.</param>
public sealed record UpdateTaskStepRequest(string QuestionType, JsonElement Payload, JsonElement AnswerKey);
