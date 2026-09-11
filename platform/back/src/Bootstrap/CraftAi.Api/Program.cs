using CraftAi.Api.Http.Errors;
using CraftAi.Api.Http.Idempotency;
using CraftAi.Api.Http.RequestId;
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

// CORS открыт только для локальной разработки кабинетов (план 01 §4, шаг 5):
// admin — 4201, learn — 4202. В проде за кабинетом и API стоит общий origin.
const string DevCorsPolicy = "DevCabinets";
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(DevCorsPolicy, policy => policy
            .WithOrigins("http://localhost:4201", "http://localhost:4202")
            .AllowAnyHeader()
            .AllowAnyMethod());
    });
}

// Модули появятся с A1 (Identity) — каждый регистрируется здесь одной строкой.
IReadOnlyList<IModule> modules = [];

foreach (var module in modules)
{
    module.AddModule(builder.Services, builder.Configuration);
}

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseCors(DevCorsPolicy);
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapDefaultEndpoints();

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
