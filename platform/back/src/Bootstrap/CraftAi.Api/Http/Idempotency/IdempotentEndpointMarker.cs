namespace CraftAi.Api.Http.Idempotency;

/// <summary>Метаданные эндпоинта: заходит под правила Idempotency-Key (API-07).</summary>
public sealed class IdempotentEndpointMarker;

public static class IdempotencyEndpointExtensions
{
    /// <summary>
    /// Требует заголовок <c>Idempotency-Key</c> на записывающем эндпоинте: повтор с тем же
    /// ключом и тем же телом отдаёт закэшированный ответ, с тем же ключом и другим телом —
    /// 409 (API-07).
    /// </summary>
    public static TBuilder RequireIdempotencyKey<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new IdempotentEndpointMarker());
        return builder;
    }
}
