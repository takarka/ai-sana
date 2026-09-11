namespace CraftAi.Modules.Identity.Contracts;

/// <summary>
/// Имена политик авторизации контура <c>platform</c> (план 08 §2) — публичный контракт,
/// чтобы другие модули могли защищать свои эндпоинты (<c>RequireAuthorization(...)</c>), не
/// ссылаясь на реализацию <c>CraftAi.Modules.Identity</c> напрямую (план 01 §3).
/// </summary>
public static class PlatformPolicyNames
{
    public const string Admin = "platform.admin";

    public const string Content = "platform.content";
}
