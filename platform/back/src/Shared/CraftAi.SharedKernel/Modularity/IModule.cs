using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.SharedKernel.Modularity;

/// <summary>
/// Точка входа модуля. <see cref="CraftAi.Api"/> собирает список реализаций и вызывает
/// их методы при старте; между собой модули не ссылаются, только через *.Contracts
/// (план 01 §3: «CraftAi.Modules.A может ссылаться на CraftAi.Modules.B.Contracts,
/// но никогда на CraftAi.Modules.B»).
/// </summary>
public interface IModule
{
    /// <summary>Имя модуля для логов и диагностики, например "Organizations".</summary>
    string Name { get; }

    /// <summary>
    /// Регистрирует то, что нужно любому хосту, который просто использует данные модуля —
    /// сейчас это <see cref="CraftAi.Api"/> и <see cref="CraftAi.MigrationService"/>: DbContext,
    /// домен, сервисы сидирования. Ничего веб-специфичного — вызывается и в MigrationService,
    /// у которого нет ни маршрутизации, ни HTTP-конвейера.
    /// </summary>
    void AddModule(IServiceCollection services, IConfiguration configuration);

    /// <summary>
    /// Регистрирует то, что имеет смысл только в веб-хосте, обслуживающем HTTP: схемы
    /// аутентификации, политики авторизации (которым нужен <c>EndpointDataSource</c> —
    /// в MigrationService его нет и регистрация упадёт при валидации DI-контейнера),
    /// сервисы, которыми пользуются только HTTP-обработчики. Вызывается только
    /// <see cref="CraftAi.Api"/>, уже после <see cref="AddModule"/>.
    /// </summary>
    void AddWebModule(IServiceCollection services, IConfiguration configuration) { }

    /// <summary>Регистрирует HTTP-эндпоинты модуля (обычно через <c>MapGroup</c>).</summary>
    void MapEndpoints(IEndpointRouteBuilder endpoints);

    /// <summary>
    /// Тип EF Core <c>DbContext</c> модуля — по нему <see cref="CraftAi.MigrationService"/>
    /// находит, что мигрировать. <c>null</c> у модулей без собственной схемы БД.
    /// </summary>
    Type? DbContextType => null;

    /// <summary>
    /// Разовая настройка данных после применения миграций модуля (план 09 §3.2, A1.5:
    /// первый суперадмин заводится отсюда). Вызывается MigrationService один раз за
    /// прогон, после успешной миграции <see cref="DbContextType"/>; обязана быть
    /// идемпотентной — повторный запуск не должен ничего дублировать.
    /// </summary>
    Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken) => Task.CompletedTask;
}
