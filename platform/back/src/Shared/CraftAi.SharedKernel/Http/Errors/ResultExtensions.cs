using CraftAi.SharedKernel.Http.RequestId;
using Microsoft.AspNetCore.Http;

namespace CraftAi.SharedKernel.Http.Errors;

/// <summary>Переводит <see cref="Result"/>/<see cref="Result{T}"/> из обработчика среза в HTTP-ответ.</summary>
public static class ResultExtensions
{
    public static IResult ToApiResult(this Result result, HttpContext context) =>
        result.IsSuccess ? Results.NoContent() : ToProblemResult(result.Error!, context);

    public static IResult ToApiResult<TValue>(
        this Result<TValue> result,
        HttpContext context,
        Func<TValue, IResult>? onSuccess = null) =>
        result.IsSuccess
            ? onSuccess?.Invoke(result.Value) ?? Results.Ok(result.Value)
            : ToProblemResult(result.Error!, context);

    private static IResult ToProblemResult(Error error, HttpContext context)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status422UnprocessableEntity,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError,
        };

        var body = new ApiError(error.Code, error.Type.ToString(), error.Message, context.GetRequestId());
        return Results.Json(body, statusCode: statusCode);
    }
}
