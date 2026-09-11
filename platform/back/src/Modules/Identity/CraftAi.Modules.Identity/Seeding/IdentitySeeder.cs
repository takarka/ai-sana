using CraftAi.Modules.Identity.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CraftAi.Modules.Identity.Seeding;

/// <summary>
/// Роли <c>platform</c> и первый суперадмин (план 09 §3.2, A1.5). Идемпотентен: если
/// хоть один пользователь уже носит роль <see cref="PlatformRoles.SuperAdmin"/>, сидирование
/// пользователя пропускается — так учётные записи, заведённые вручную позже, не трогаются.
/// </summary>
public sealed class IdentitySeeder(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    IOptions<SuperAdminSeedOptions> options,
    TimeProvider timeProvider,
    ILogger<IdentitySeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        foreach (var role in PlatformRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role) { Id = Guid.NewGuid() });
            }
        }

        var existingSuperAdmins = await userManager.GetUsersInRoleAsync(PlatformRoles.SuperAdmin);
        if (existingSuperAdmins.Count > 0)
        {
            return;
        }

        var email = options.Value.Email;
        var password = options.Value.InitialPassword;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                $"Суперадминов ещё нет, а {SuperAdminSeedOptions.SectionName}:Email / " +
                $"{SuperAdminSeedOptions.SectionName}:InitialPassword не заданы — войти в платформу некому.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FullName = options.Value.FullName,
            MustChangePassword = true,
            CreatedAtUtc = timeProvider.GetUtcNow(),
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Не удалось создать первого суперадмина: " +
                $"{string.Join("; ", createResult.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRoleAsync(user, PlatformRoles.SuperAdmin);

        logger.LogInformation("Первый суперадмин заведён: {Email}.", email);
    }
}
