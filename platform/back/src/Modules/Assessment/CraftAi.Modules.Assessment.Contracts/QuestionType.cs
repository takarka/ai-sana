namespace CraftAi.Modules.Assessment.Contracts;

/// <summary>
/// Восемь типов заданий закрытого типа из плана 06 §2 (FR-CMS-02) — единственные,
/// что проверяются машиной без участия учителя. Общий список для <c>Content</c>
/// (MATRIX) и будущего <c>Pisa</c> (план 09 §3.5).
/// </summary>
public enum QuestionType
{
    /// <summary>Один правильный вариант из нескольких.</summary>
    SingleChoice,

    /// <summary>Несколько правильных вариантов.</summary>
    MultipleChoice,

    /// <summary>Сопоставить термин и определение.</summary>
    Matching,

    /// <summary>Расставить элементы по порядку.</summary>
    Ordering,

    /// <summary>Вписать слово/число в пропуск в тексте.</summary>
    FillInBlank,

    /// <summary>Числовой ответ с допуском, например 42 ± 0.5.</summary>
    NumericTolerance,

    /// <summary>Короткий текстовый ответ, проверка по эталону.</summary>
    ShortText,

    /// <summary>Разнести элементы по категориям (drag &amp; drop).</summary>
    DragAndDrop,
}
