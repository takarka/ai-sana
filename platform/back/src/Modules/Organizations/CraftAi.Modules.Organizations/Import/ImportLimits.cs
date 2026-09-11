namespace CraftAi.Modules.Organizations.Import;

/// <summary>Ограничения размера импорта (план 09 §3.3, A2.8) — внятная ошибка вместо таймаута.</summary>
public static class ImportLimits
{
    public const long MaxFileSizeBytes = 2 * 1024 * 1024;

    public const int MaxRows = 500;
}
