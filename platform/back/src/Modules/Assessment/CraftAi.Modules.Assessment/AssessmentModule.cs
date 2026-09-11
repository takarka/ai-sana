using CraftAi.Modules.Assessment.Contracts;
using CraftAi.Modules.Assessment.Validation;
using CraftAi.SharedKernel.Modularity;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Assessment;

/// <summary>
/// Схема и валидация вопросов закрытого типа (план 09 §3.5, О2) — только структурная
/// проверка <c>payload</c>/<c>answer_key</c> при авторинге. Своей схемы БД и HTTP-эндпоинтов
/// нет: модуль — библиотека, которую вызывает <c>Content</c> (и позже <c>Pisa</c>) через
/// <see cref="IQuestionValidationService"/>, не зная о его внутреннем устройстве.
/// </summary>
public sealed class AssessmentModule : IModule
{
    public string Name => "Assessment";

    public void AddModule(IServiceCollection services, IConfiguration configuration) =>
        services.AddSingleton<IQuestionValidationService, QuestionValidationService>();

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // Нет собственных HTTP-эндпоинтов — см. XML-комментарий класса.
    }
}
