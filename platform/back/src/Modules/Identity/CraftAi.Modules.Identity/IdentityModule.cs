using System.Security.Claims;
using System.Text;
using CraftAi.Modules.Identity.Audit;
using CraftAi.Modules.Identity.Domain;
using CraftAi.Modules.Identity.Features.Authentication.ChangePassword;
using CraftAi.Modules.Identity.Features.Authentication.Login;
using CraftAi.Modules.Identity.Features.Authentication.Logout;
using CraftAi.Modules.Identity.Features.Authentication.Refresh;
using CraftAi.Modules.Identity.Features.Profile.GetCurrentUser;
using CraftAi.Modules.Identity.Persistence;
using CraftAi.Modules.Identity.Security;
using CraftAi.Modules.Identity.Seeding;
using CraftAi.SharedKernel.Modularity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CraftAi.Modules.Identity;

/// <summary>
/// Узкий срез (план 09 §3.2): вход, refresh, смена пароля, /me, роли и политики
/// контура <c>platform</c>. Нет 2FA (план 08), SSO и входа по коду класса (FR-CORE-04,
/// относится к <c>learn</c>).
/// </summary>
public sealed class IdentityModule : IModule
{
    public string Name => "Identity";

    public Type? DbContextType => typeof(IdentityDbContext);

    public void AddModule(IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<IdentityDbContext>(options => options
            .UseNpgsql(configuration.GetConnectionString("craftai"))
            .UseSnakeCaseNamingConvention());

        services
            .AddOptions<SuperAdminSeedOptions>()
            .Bind(configuration.GetSection(SuperAdminSeedOptions.SectionName));

        services
            .AddIdentityCore<ApplicationUser>(options => options.User.RequireUniqueEmail = true)
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<IdentityDbContext>();

        services.AddScoped<IdentitySeeder>();
    }

    public void AddWebModule(IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddScoped<JwtTokenService>();
        services.AddScoped<RefreshTokenService>();
        services.AddScoped<LoginAuditLogger>();

        services.AddPlatformPolicies();

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // Иначе .NET переименует короткие claim-имена в легаси XML-namespace URI —
                // JwtTokenService и здесь должны совпадать буквально в имени типа claim'а.
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSection["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSection["Audience"],
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSection["SigningKey"] ?? string.Empty)),
                    RoleClaimType = ClaimTypes.Role,
                    NameClaimType = ClaimTypes.Name,
                };
            });
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        var auth = endpoints.MapGroup("/auth");
        LoginEndpoint.Map(auth);
        RefreshEndpoint.Map(auth);
        LogoutEndpoint.Map(auth);
        ChangePasswordEndpoint.Map(auth);

        GetCurrentUserEndpoint.Map(endpoints);
    }

    public async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        var seeder = services.GetRequiredService<IdentitySeeder>();
        await seeder.SeedAsync(cancellationToken);
    }
}
