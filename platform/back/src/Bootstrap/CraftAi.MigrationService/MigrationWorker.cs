using CraftAi.SharedKernel.Modularity;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.MigrationService;

/// <summary>
/// Применяет EF Core миграции каждого модуля отдельным шагом, не на старте API
/// (NFR-MNT-05: миграции на старте ломают rolling update), и следом вызывает
/// <see cref="IModule.SeedAsync"/> — идемпотентную разовую настройку данных
/// (план 09 §3.2, A1.5: первый суперадмин). Список модулей собирается из
/// <see cref="IModule.DbContextType"/> зарегистрированных модулей — сейчас их нет,
/// но провалить или зависнуть на пустом списке сервис не должен: это ровно то
/// состояние, в котором он стартовал до A1.
/// </summary>
public sealed class MigrationWorker(
    IServiceProvider serviceProvider,
    IReadOnlyList<IModule> modules,
    IHostApplicationLifetime lifetime,
    ILogger<MigrationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var exitCode = 0;

        foreach (var module in modules)
        {
            if (stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning("Остановка запрошена — оставшиеся модули не обработаны.");
                exitCode = 1;
                break;
            }

            using var scope = serviceProvider.CreateScope();

            if (module.DbContextType is { } dbContextType)
            {
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
                    continue;
                }
            }

            try
            {
                await module.SeedAsync(scope.ServiceProvider, CancellationToken.None);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Сидирование модуля {Module} провалилось.", module.Name);
                exitCode = 1;
            }
        }

        Environment.ExitCode = exitCode;
        lifetime.StopApplication();
    }
}
