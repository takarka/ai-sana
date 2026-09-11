using CraftAi.SharedKernel.Http.Errors;
using CraftAi.SharedKernel.Http.RequestId;
using Microsoft.AspNetCore.Diagnostics;

namespace CraftAi.Api.Http.Errors;

/// <summary>
/// Ловит необработанные исключения (сигнал непредвиденной ошибки — ожидаемые сбои
/// обработчики возвращают через <see cref="CraftAi.SharedKernel.Result"/>, не бросают)
/// и превращает их в тот же формат <see cref="ApiError"/>, не раскрывая детали клиенту.
/// </summary>
public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var requestId = httpContext.GetRequestId();

        logger.LogError(exception, "Необработанное исключение. RequestId={RequestId}", requestId);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var body = new ApiError(
            Code: "internal-error",
            Type: "Failure",
            Message: "Внутренняя ошибка сервера.",
            RequestId: requestId);

        await httpContext.Response.WriteAsJsonAsync(body, cancellationToken);

        return true;
    }
}
