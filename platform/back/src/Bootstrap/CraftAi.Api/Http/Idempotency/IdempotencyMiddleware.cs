using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CraftAi.Api.Http.Errors;
using CraftAi.Api.Http.RequestId;
using Microsoft.Extensions.Caching.Distributed;

namespace CraftAi.Api.Http.Idempotency;

/// <summary>
/// Idempotency-Key на эндпоинтах с <see cref="IdempotentEndpointMarker"/> (API-07):
/// повтор с тем же ключом и тем же телом отдаёт закэшированный ответ вместо повторного
/// выполнения обработчика; тот же ключ с другим телом — 409. Эндпоинтов без метки
/// не касается вообще.
/// </summary>
public sealed class IdempotencyMiddleware(RequestDelegate next)
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    public async Task InvokeAsync(HttpContext context, IDistributedCache cache)
    {
        if (context.GetEndpoint()?.Metadata.GetMetadata<IdempotentEndpointMarker>() is null)
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("Idempotency-Key", out var keyValues) ||
            string.IsNullOrWhiteSpace(keyValues.ToString()))
        {
            await WriteProblemAsync(
                context,
                StatusCodes.Status400BadRequest,
                "idempotency-key-required",
                "Записывающие запросы обязаны нести заголовок Idempotency-Key.");
            return;
        }

        var key = keyValues.ToString();
        var requestHash = await ComputeRequestHashAsync(context);
        var cacheKey = $"idempotency:{context.Request.Method}:{context.Request.Path}:{key}";

        var cachedBytes = await cache.GetAsync(cacheKey, context.RequestAborted);
        if (cachedBytes is not null)
        {
            var cached = JsonSerializer.Deserialize<CachedResponse>(cachedBytes)!;

            if (cached.RequestHash != requestHash)
            {
                await WriteProblemAsync(
                    context,
                    StatusCodes.Status409Conflict,
                    "idempotency-key-reused",
                    "Idempotency-Key уже использован с другим телом запроса.");
                return;
            }

            context.Response.StatusCode = cached.StatusCode;
            if (cached.ContentType is not null)
            {
                context.Response.ContentType = cached.ContentType;
            }

            await context.Response.Body.WriteAsync(cached.Body, context.RequestAborted);
            return;
        }

        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        try
        {
            await next(context);
        }
        finally
        {
            context.Response.Body = originalBody;
        }

        var responseBytes = buffer.ToArray();

        if (context.Response.StatusCode is >= 200 and < 300)
        {
            var toCache = new CachedResponse(
                context.Response.StatusCode,
                context.Response.ContentType,
                responseBytes,
                requestHash);

            await cache.SetAsync(
                cacheKey,
                JsonSerializer.SerializeToUtf8Bytes(toCache),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheDuration },
                context.RequestAborted);
        }

        await originalBody.WriteAsync(responseBytes, context.RequestAborted);
    }

    private static async Task<string> ComputeRequestHashAsync(HttpContext context)
    {
        context.Request.EnableBuffering();
        context.Request.Body.Position = 0;

        using var sha256 = SHA256.Create();
        await using var bodyCopy = new MemoryStream();
        await context.Request.Body.CopyToAsync(bodyCopy, context.RequestAborted);
        context.Request.Body.Position = 0;

        var hashInput = $"{context.Request.Method}:{context.Request.Path}:";
        var hashBytes = Encoding.UTF8.GetBytes(hashInput).Concat(bodyCopy.ToArray()).ToArray();

        return Convert.ToHexString(sha256.ComputeHash(hashBytes));
    }

    private static Task WriteProblemAsync(HttpContext context, int statusCode, string code, string message)
    {
        context.Response.StatusCode = statusCode;
        var body = new ApiError(code, "Validation", message, context.GetRequestId());
        return context.Response.WriteAsJsonAsync(body, context.RequestAborted);
    }
}
