using System.Text.Json;
using CraftAi.SharedKernel;

namespace CraftAi.Modules.Assessment.Contracts;

/// <summary>
/// Публичный контракт <c>Assessment</c> (план 09 §3.5, О2): структурная проверка
/// <c>payload</c>/<c>answer_key</c> вопроса при сохранении — только это нужно авторингу
/// (<c>Content</c>, позже <c>Pisa</c>). Проверка ответа ученика («ответ → верно/неверно»)
/// сюда не входит — она появится в <c>Learning</c>/<c>Pisa.Trainers</c> отдельным срезом.
/// </summary>
public interface IQuestionValidationService
{
    /// <summary>
    /// Возвращает <see cref="Error.Validation"/> с человекочитаемой причиной первого
    /// нарушения, если структура <paramref name="payload"/>/<paramref name="answerKey"/>
    /// не соответствует <paramref name="type"/>; иначе — успех.
    /// </summary>
    Result Validate(QuestionType type, JsonElement payload, JsonElement answerKey);
}
