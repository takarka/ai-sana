namespace CraftAi.Modules.Content.Domain;

/// <summary>
/// Один материал шага <see cref="LessonStepType.Theory"/>. <see cref="Content"/> — тело
/// текста для <see cref="StepMaterialType.Text"/>, ссылка на файл для остальных типов
/// (загрузка самого файла — вне A3, узкий срез хранит только ссылку).
/// </summary>
public sealed class StepMaterial
{
    public Guid Id { get; init; }

    public required Guid LessonStepId { get; init; }

    public required StepMaterialType Type { get; init; }

    public required string Content { get; set; }

    public int Position { get; set; }
}
