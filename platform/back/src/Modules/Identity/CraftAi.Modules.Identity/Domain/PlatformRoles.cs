namespace CraftAi.Modules.Identity.Domain;

/// <summary>Имена ролей контура <c>platform</c> — ровно матрица плана 08 §2.</summary>
public static class PlatformRoles
{
    public const string SuperAdmin = "superadmin";

    public const string Author = "author";

    public static readonly IReadOnlyList<string> All = [SuperAdmin, Author];
}
