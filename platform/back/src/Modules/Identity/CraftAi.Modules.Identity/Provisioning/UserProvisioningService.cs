using System.Security.Cryptography;
using System.Text;
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
        // формат при RequireUniqueEmail (см. сопроводительную сводку к A1/A2). Короткий
        // случайный суффикс (а не полный GUID) достаточен для уникальности локальной части
        // и не превращает узнаваемый по ФИО логин в нечитаемую строку.
        var login = $"{Slugify(request.LoginSeed)}.{ShortSuffix()}@craftai.local";
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
        // ASP.NET Core Identity по умолчанию (UserOptions.AllowedUserNameCharacters) не пускает
        // в UserName кириллицу, а ФИО и учеников, и учителей, и методистов почти всегда
        // кириллическое (включая казахские буквы) — транслитерируем в латиницу, а не просто
        // отбрасываем нелатинские символы, иначе логин совсем не связан с ФИО (см. фактическую
        // ошибку: до этой правки Slugify возвращал случайный GUID для любого кириллического seed).
        var slug = new string([.. Transliterate(seed).Where(char.IsAsciiLetterOrDigit)]).ToLowerInvariant();
        return string.IsNullOrEmpty(slug) ? Guid.NewGuid().ToString("n") : slug;
    }

    private static string ShortSuffix()
    {
        // 6 байт (48 бит случайности) — коллизия на импорте в тысячи учётных записей
        // за раз практически исключена, а сам суффикс всё равно короче GUID в разы.
        Span<byte> bytes = stackalloc byte[6];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexStringLower(bytes);
    }

    private static readonly IReadOnlyDictionary<char, string> CyrillicToLatin = new Dictionary<char, string>
    {
        ['а'] = "a", ['б'] = "b", ['в'] = "v", ['г'] = "g", ['д'] = "d", ['е'] = "e", ['ё'] = "e",
        ['ж'] = "zh", ['з'] = "z", ['и'] = "i", ['й'] = "i", ['к'] = "k", ['л'] = "l", ['м'] = "m",
        ['н'] = "n", ['о'] = "o", ['п'] = "p", ['р'] = "r", ['с'] = "s", ['т'] = "t", ['у'] = "u",
        ['ф'] = "f", ['х'] = "kh", ['ц'] = "ts", ['ч'] = "ch", ['ш'] = "sh", ['щ'] = "shch",
        ['ъ'] = "", ['ы'] = "y", ['ь'] = "", ['э'] = "e", ['ю'] = "yu", ['я'] = "ya",
        // Казахские буквы вне русского алфавита (план 08 §4 — школы РК).
        ['ә'] = "a", ['ғ'] = "g", ['қ'] = "q", ['ң'] = "n", ['ө'] = "o", ['ұ'] = "u",
        ['ү'] = "u", ['һ'] = "h", ['і'] = "i",
    };

    private static string Transliterate(string value)
    {
        var builder = new StringBuilder(value.Length);
        foreach (var ch in value.ToLowerInvariant())
        {
            builder.Append(CyrillicToLatin.TryGetValue(ch, out var latin) ? latin : ch.ToString());
        }

        return builder.ToString();
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
