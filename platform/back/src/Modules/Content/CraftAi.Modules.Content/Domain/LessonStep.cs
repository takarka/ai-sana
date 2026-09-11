namespace CraftAi.Modules.Content.Domain;

/// <summary>
/// Шаг урока: материалы (<see cref="LessonStepType.Theory"/>, ноль-и-более
/// <see cref="StepMaterial"/>) или задание (<see cref="LessonStepType.Task"/>, ровно один
/// <see cref="Question"/>) — план 09 §3.4.
/// </summary>
public sealed class LessonStep
{
    public Guid Id { get; init; }

    public required Guid LessonId { get; init; }

    public required LessonStepType Type { get; init; }

    public int Position { get; set; }
}
