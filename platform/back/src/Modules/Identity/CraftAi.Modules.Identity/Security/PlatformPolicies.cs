using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Identity.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Identity.Security;

/// <summary>
/// Матрица прав плана 08 §2, дословно. Имена политик живут в <see cref="PlatformPolicyNames"/>
/// (Identity.Contracts) — здесь только их регистрация с конкретными ролями.
/// </summary>
public static class PlatformPolicies
{
    public const string Admin = PlatformPolicyNames.Admin;

    public const string Content = PlatformPolicyNames.Content;

    public static void AddPlatformPolicies(this IServiceCollection services) =>
        services.AddAuthorizationBuilder()
            .AddPolicy(Admin, policy => policy.RequireRole(PlatformRoles.SuperAdmin))
            .AddPolicy(Content, policy => policy.RequireRole(PlatformRoles.SuperAdmin, PlatformRoles.Author));
}
