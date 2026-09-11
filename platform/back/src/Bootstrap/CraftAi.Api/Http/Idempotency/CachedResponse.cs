namespace CraftAi.Api.Http.Idempotency;

/// <summary>Что кэшируется под ключом Idempotency-Key — достаточно, чтобы точно воспроизвести ответ.</summary>
public sealed record CachedResponse(int StatusCode, string? ContentType, byte[] Body, string RequestHash);
