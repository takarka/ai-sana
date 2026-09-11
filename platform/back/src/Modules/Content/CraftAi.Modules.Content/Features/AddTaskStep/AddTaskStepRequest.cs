using System.Text.Json;

namespace CraftAi.Modules.Content.Features.AddTaskStep;

/// <param name="QuestionType">Одно из восьми значений <see cref="CraftAi.Modules.Assessment.Contracts.QuestionType"/> — план 06 §2.</param>
public sealed record AddTaskStepRequest(string QuestionType, JsonElement Payload, JsonElement AnswerKey);
