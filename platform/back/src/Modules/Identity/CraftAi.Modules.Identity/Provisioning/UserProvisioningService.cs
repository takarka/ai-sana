using System.Security.Cryptography;
using CraftAi.Modules.Identity.Contracts;
using CraftAi.Modules.Identity.Domain;
using CraftAi.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace CraftAi.Modules.Identity.Provisioning;

/// <summary>Реализация <see cref="IUserProvisioningService"/> — план 09 §3.3, A2.4/A2.7.</summary>
public sealed class UserProvisioningService(UserManager<ApplicationUser> userManager, TimeProvider timeProvider)
    : IUserProvisioningService
{
    public async Task<Result<ProvisionedUser>> ProvisionUserAsync(
        ProvisionUserRequest request, CancellationToken cancellationToken)
    {
        // У учителей/учеников в v0 нет реальной почты (план 08 §4) — логин синтетический,
        // но обязан пройти EmailAddressAttribute, которым ASP.NET Core Identity проверяет
        // формат при RequireUniqueEmail (см. сопроводительную сводку к A1/A2).
        var login = $"{Slugify(request.LoginSeed)}@{Guid.NewGuid():n}.craftai.local";
        var password = GeneratePassword();

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = login,
            Email = login,
            EmailConfirmed = true,
            FullName = request.FullName,
            MustChangePassword = true,
            CreatedAtUtc = timeProvider.GetUtcNow(),
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var message = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return Result.Failure<ProvisionedUser>(Error.Failure("provisioning.create-failed", message));
        }

        return Result.Success(new ProvisionedUser(user.Id, login, password));
    }

    private static string Slugify(string seed)
    {
        // Только ASCII: ASP.NET Core Identity по умолчанию (UserOptions.AllowedUserNameCharacters)
        // не пускает в UserName кириллицу — а ФИО и ученики, и учителя почти всегда кириллические.
        // Раз логин синтетический и не обязан быть читаемым (см. XML-комментарий контракта),
        // при нелатинском seed просто откатываемся на guid — это норма, а не редкий случай.
        var slug = new string([.. seed.Where(char.IsAsciiLetterOrDigit)]).ToLowerInvariant();
        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString("n") : slug;
    }

    private static string GeneratePassword()
    {
        // Удовлетворяет дефолтной PasswordOptions ASP.NET Core Identity: цифра, строчная,
        // прописная, спецсимвол, длина ≥ 6 — здесь сразу 12 символов с гарантированным
        // набором категорий.
        const string lower = "abcdefghjkmnpqrstuvwxyz";
        const string upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
        const string digits = "23456789";
        const string special = "!@#$%";

        var required = new[]
        {
            lower[RandomNumberGenerator.GetInt32(lower.Length)],
            upper[RandomNumberGenerator.GetInt32(upper.Length)],
            digits[RandomNumberGenerator.GetInt32(digits.Length)],
            special[RandomNumberGenerator.GetInt32(special.Length)],
        };

        const string all = lower + upper + digits + special;
        var filler = Enumerable.Range(0, 8).Select(_ => all[RandomNumberGenerator.GetInt32(all.Length)]);

        return new string([.. required.Concat(filler).OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue))]);
    }
}
