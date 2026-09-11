using CraftAi.Modules.Identity.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Identity.Security;

/// <summary>Матрица прав плана 08 §2, дословно.</summary>
public static class PlatformPolicies
{
    public const string Admin = "platform.admin";

    public const string Content = "platform.content";

    public static void AddPlatformPolicies(this IServiceCollection services) =>
        services.AddAuthorizationBuilder()
            .AddPolicy(Admin, policy => policy.RequireRole(PlatformRoles.SuperAdmin))
            .AddPolicy(Content, policy => policy.RequireRole(PlatformRoles.SuperAdmin, PlatformRoles.Author));
}
