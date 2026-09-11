namespace CraftAi.SharedKernel;

/// <summary>
/// Результат операции без значения: успех или <see cref="Error"/>.
/// Обработчики срезов возвращают Result вместо исключений для ожидаемых сбоев —
/// исключение остаётся сигналом непредвиденной ошибки, а не части потока управления.
/// </summary>
public class Result
{
    protected Result(bool isSuccess, Error? error)
    {
        if (isSuccess && error is not null)
        {
            throw new InvalidOperationException("Успешный результат не может нести ошибку.");
        }

        if (!isSuccess && error is null)
        {
            throw new InvalidOperationException("Неуспешный результат обязан нести ошибку.");
        }

        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }

    public bool IsFailure => !IsSuccess;

    public Error? Error { get; }

    public static Result Success() => new(true, null);

    public static Result Failure(Error error) => new(false, error);

    public static Result<TValue> Success<TValue>(TValue value) => new(value, true, null);

    public static Result<TValue> Failure<TValue>(Error error) => new(default, false, error);
}

/// <summary>Результат операции со значением при успехе.</summary>
public sealed class Result<TValue> : Result
{
    private readonly TValue? _value;

    internal Result(TValue? value, bool isSuccess, Error? error)
        : base(isSuccess, error)
    {
        _value = value;
    }

    /// <summary>Значение при успехе. Обращение при неуспехе — ошибка использования, а не домена.</summary>
    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Нельзя прочитать Value неуспешного результата.");

    public static implicit operator Result<TValue>(TValue value) => Success(value);
}
