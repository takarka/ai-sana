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

    /// <summary>Регистрирует сервисы, DbContext и опции модуля в DI-контейнере.</summary>
    void AddModule(IServiceCollection services, IConfiguration configuration);

    /// <summary>Регистрирует HTTP-эндпоинты модуля (обычно через <c>MapGroup</c>).</summary>
    void MapEndpoints(IEndpointRouteBuilder endpoints);

    /// <summary>
    /// Тип EF Core <c>DbContext</c> модуля — по нему <see cref="CraftAi.MigrationService"/>
    /// находит, что мигрировать. <c>null</c> у модулей без собственной схемы БД.
    /// </summary>
    Type? DbContextType => null;
}
