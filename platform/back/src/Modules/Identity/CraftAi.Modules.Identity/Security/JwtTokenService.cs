using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CraftAi.Modules.Identity.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CraftAi.Modules.Identity.Security;

/// <summary>Выпускает access-токен (API-02). Refresh — забота <see cref="RefreshTokenService"/>.</summary>
public sealed class JwtTokenService(IOptions<JwtOptions> options, TimeProvider timeProvider)
{
    public (string Token, DateTimeOffset ExpiresAtUtc) CreateAccessToken(ApplicationUser user, IReadOnlyList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Value.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var now = timeProvider.GetUtcNow();
        var expiresAtUtc = now.Add(options.Value.AccessTokenLifetime);

        var token = new JwtSecurityToken(
            issuer: options.Value.Issuer,
            audience: options.Value.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
    }
}
