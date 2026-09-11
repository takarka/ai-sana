using CraftAi.Modules.Identity.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Identity.Persistence;

/// <summary>Схема <c>identity</c> (план 01 §5: одна схема на модуль, snake_case).</summary>
public sealed class IdentityDbContext(DbContextOptions<IdentityDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<LoginAuditEvent> LoginAuditEvents => Set<LoginAuditEvent>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("identity");

        // IdentityDbContext<> сам называет свои таблицы (ToTable("AspNetUsers") и т. п.) —
        // явные имена в builder.Entity<T>().OnModelCreating обходят конвенцию именования,
        // поэтому переименовываем вручную, иначе только наши таблицы будут snake_case,
        // а встроенные Identity — нет (план 01 §5: единая конвенция на всю БД).
        builder.Entity<ApplicationUser>().ToTable("users");
        builder.Entity<IdentityRole<Guid>>().ToTable("roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasIndex(t => t.FamilyId);
            entity.Property(t => t.TokenHash).HasMaxLength(128);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LoginAuditEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OccurredAtUtc);
            entity.Property(e => e.EventType).HasConversion<string>().HasMaxLength(32);
        });
    }
}
