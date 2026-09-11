using CraftAi.Api.Http.Errors;
using CraftAi.Modules.Assessment;
using CraftAi.Modules.Content;
using CraftAi.Modules.Identity;
using CraftAi.Modules.Organizations;
using CraftAi.Modules.Pisa;
using CraftAi.SharedKernel.Http.Idempotency;
using CraftAi.SharedKernel.Http.RequestId;
using CraftAi.SharedKernel.Modularity;
using CraftAi.ServiceDefaults;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.AddRedisDistributedCache("cache");

builder.Services.AddOpenApi(options =>
{
    options.OpenApiVersion = OpenApiSpecVersion.OpenApi3_1;
});

builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();

// CORS для кабинетов (план 01 §4, шаг 5): admin.craftai.kz — не общий origin
// с API, как предполагалось изначально, а отдельный поддомен (см. фактический
// деплой), поэтому политика нужна не только в деве и не по условию
// IsDevelopment(). Источник списка — конфигурация (Cors:AllowedOrigins), а не
// константа в коде: домен learn (когда появится) и смена домена продовых
// кабинетов не требуют пересборки бэкенда. AllowCredentials() обязателен —
// refresh/logout идут с httpOnly-cookie.
const string CabinetsCorsPolicy = "Cabinets";
var corsAllowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy(CabinetsCorsPolicy, policy => policy
        .WithOrigins(corsAllowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// Каждый модуль регистрируется здесь одной строкой.
IReadOnlyList<IModule> modules =
    [new IdentityModule(), new OrganizationsModule(), new AssessmentModule(), new ContentModule(), new PisaModule()];

foreach (var module in modules)
{
    module.AddModule(builder.Services, builder.Configuration);
    module.AddWebModule(builder.Services, builder.Configuration);
}

var app = builder.Build();

app.UseExceptionHandler();

app.UseCors(CabinetsCorsPolicy);

// Сервер сейчас всегда играет роль develop-окружения (нет отдельного прод-контура),
// поэтому OpenAPI/Scalar открыты без привязки к ASPNETCORE_ENVIRONMENT.
app.MapOpenApi();
app.MapScalarApiReference();

app.MapDefaultEndpoints();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<RequestIdMiddleware>();
app.UseMiddleware<IdempotencyMiddleware>();

app.MapGet("/api/v1/ping", () => Results.Ok(new { status = "ok", version = "v1" }))
    .WithName("Ping");

foreach (var module in modules)
{
    module.MapEndpoints(app);
}

app.Run();

// Точка входа для WebApplicationFactory<Program> в интеграционных тестах.
public partial class Program;
