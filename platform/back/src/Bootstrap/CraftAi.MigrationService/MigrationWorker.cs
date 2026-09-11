using Microsoft.EntityFrameworkCore;

namespace CraftAi.MigrationService;

/// <summary>
/// Применяет EF Core миграции каждого модуля отдельным шагом, не на старте API
/// (NFR-MNT-05: миграции на старте ломают rolling update). Список типов DbContext
/// собирается из <see cref="CraftAi.SharedKernel.Modularity.IModule.DbContextType"/>
/// зарегистрированных модулей — сейчас их нет, но провалить или зависнуть на пустом
/// списке сервис не должен: это ровно то состояние, в котором он стартует до A1.
/// </summary>
public sealed class MigrationWorker(
    IServiceProvider serviceProvider,
    IReadOnlyList<Type> dbContextTypes,
    IHostApplicationLifetime lifetime,
    ILogger<MigrationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var exitCode = 0;

        foreach (var dbContextType in dbContextTypes)
        {
            if (stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning("Остановка запрошена — оставшиеся миграции не применены.");
                exitCode = 1;
                break;
            }

            using var scope = serviceProvider.CreateScope();
            var context = (DbContext)scope.ServiceProvider.GetRequiredService(dbContextType);

            try
            {
                logger.LogInformation("Применяю миграции {DbContext}...", dbContextType.Name);

                // CancellationToken.None: раз миграция начата, она обязана либо
                // применить схему целиком, либо провалиться сама — досрочная отмена
                // по сигналу остановки хоста оставила бы схему в промежуточном
                // состоянии, что мы не можем себе позволить (см. §7 плана 09, О4).
                await context.Database.MigrateAsync(CancellationToken.None);

                logger.LogInformation("Миграции {DbContext} применены.", dbContextType.Name);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Не удалось применить миграции {DbContext}.", dbContextType.Name);
                exitCode = 1;
            }
        }

        Environment.ExitCode = exitCode;
        lifetime.StopApplication();
    }
}
