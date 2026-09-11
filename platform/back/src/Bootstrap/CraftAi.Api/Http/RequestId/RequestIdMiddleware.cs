namespace CraftAi.Api.Http.RequestId;

/// <summary>
/// X-Request-Id (API-03, NFR-OBS-01): принимает значение от вызывающей стороны или
/// генерирует новое, кладёт в <see cref="HttpContext.Items"/> под <see cref="ItemsKey"/>
/// (обработчики ошибок читают его оттуда) и возвращает в заголовке ответа.
/// </summary>
public sealed class RequestIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Request-Id";
    public const string ItemsKey = "RequestId";

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.Request.Headers.TryGetValue(HeaderName, out var incoming) &&
                         !string.IsNullOrWhiteSpace(incoming)
            ? incoming.ToString()
            : Guid.NewGuid().ToString("n");

        context.Items[ItemsKey] = requestId;
        context.Response.Headers[HeaderName] = requestId;

        using (context.RequestServices
                   .GetRequiredService<ILoggerFactory>()
                   .CreateLogger("RequestId")
                   .BeginScope(new Dictionary<string, object> { ["RequestId"] = requestId }))
        {
            await next(context);
        }
    }
}

public static class RequestIdHttpContextExtensions
{
    /// <summary>
    /// Текущий X-Request-Id. Вызывается прежде всего из путей форматирования ошибок —
    /// им нельзя падать самим, поэтому при отсутствии <see cref="RequestIdMiddleware"/> в
    /// цепочке (что уже свидетельствовало бы о более серьёзной проблеме) возвращается
    /// свежий id, а не бросается исключение.
    /// </summary>
    public static string GetRequestId(this HttpContext context) =>
        context.Items.TryGetValue(RequestIdMiddleware.ItemsKey, out var value) && value is string requestId
            ? requestId
            : Guid.NewGuid().ToString("n");
}
