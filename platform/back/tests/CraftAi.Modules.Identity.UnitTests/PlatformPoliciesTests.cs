using System.Security.Claims;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Identity.UnitTests;

/// <summary>
/// Матрица прав плана 08 §2, проверенная напрямую на движке авторизации — без HTTP и БД,
/// не дожидаясь появления защищённого продуктового эндпоинта (он появится в A2, когда
/// у platform.admin будет что защищать: /platform/orgs).
/// </summary>
public sealed class PlatformPoliciesTests
{
    private readonly IAuthorizationService _authorizationService;

    public PlatformPoliciesTests()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorizationCore();
        services.AddPlatformPolicies();
        _authorizationService = services.BuildServiceProvider().GetRequiredService<IAuthorizationService>();
    }

    [Fact]
    public async Task SuperAdmin_ПроходитОбеПолитики()
    {
        var principal = PrincipalWithRole(PlatformRoles.SuperAdmin);

        Assert.True((await _authorizationService.AuthorizeAsync(principal, PlatformPolicies.Admin)).Succeeded);
        Assert.True((await _authorizationService.AuthorizeAsync(principal, PlatformPolicies.Content)).Succeeded);
    }

    [Fact]
    public async Task Author_ПроходитТолькоContent()
    {
        var principal = PrincipalWithRole(PlatformRoles.Author);

        Assert.False((await _authorizationService.AuthorizeAsync(principal, PlatformPolicies.Admin)).Succeeded);
        Assert.True((await _authorizationService.AuthorizeAsync(principal, PlatformPolicies.Content)).Succeeded);
    }

    [Fact]
    public async Task БезРолей_НеПроходитНиОднуПолитику()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        Assert.False((await _authorizationService.AuthorizeAsync(principal, PlatformPolicies.Admin)).Succeeded);
        Assert.False((await _authorizationService.AuthorizeAsync(principal, PlatformPolicies.Content)).Succeeded);
    }

    private static ClaimsPrincipal PrincipalWithRole(string role)
    {
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.Role, role)], authenticationType: "Test");
        return new ClaimsPrincipal(identity);
    }
}
