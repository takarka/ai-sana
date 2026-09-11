using CraftAi.Modules.Content.Features.AddTaskStep;
using CraftAi.Modules.Content.Features.AddTheoryStep;
using CraftAi.Modules.Content.Features.CreateLesson;
using CraftAi.Modules.Content.Features.CreateSection;
using CraftAi.Modules.Content.Features.GetLesson;
using CraftAi.Modules.Content.Features.ListLessons;
using CraftAi.Modules.Content.Features.ListSections;
using CraftAi.Modules.Content.Features.UpdateLesson;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel.Modularity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CraftAi.Modules.Content;

/// <summary>
/// Узкий срез авторинга MATRIX (план 09 §3.4): разделы, уроки, материалы, задания
/// закрытого типа. Публикация не отдельная команда — сохранение сразу помечает урок
/// опубликованным. Доступ — контур <c>platform</c>, политика <c>platform.content</c>
/// (<c>superadmin</c> и методист).
/// </summary>
public sealed class ContentModule : IModule
{
    public string Name => "Content";

    public Type? DbContextType => typeof(ContentDbContext);

    public void AddModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ContentDbContext>(options => options
            .UseNpgsql(configuration.GetConnectionString("craftai"))
            .UseSnakeCaseNamingConvention());
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var matrix = endpoints.MapGroup("/platform/content/matrix");

        CreateSectionEndpoint.Map(matrix);
        ListSectionsEndpoint.Map(matrix);

        CreateLessonEndpoint.Map(matrix);
        UpdateLessonEndpoint.Map(matrix);
        ListLessonsEndpoint.Map(matrix);
        GetLessonEndpoint.Map(matrix);

        AddTheoryStepEndpoint.Map(matrix);
        AddTaskStepEndpoint.Map(matrix);
    }
}
