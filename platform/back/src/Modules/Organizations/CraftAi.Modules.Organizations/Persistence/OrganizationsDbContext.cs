using CraftAi.Modules.Organizations.Domain;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Organizations.Persistence;

/// <summary>Схема <c>organizations</c> (план 01 §5: одна схема на модуль, snake_case).</summary>
public sealed class OrganizationsDbContext(DbContextOptions<OrganizationsDbContext> options) : DbContext(options)
{
    public DbSet<Organization> Organizations => Set<Organization>();

    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();

    public DbSet<ClassGroup> ClassGroups => Set<ClassGroup>();

    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();

    public DbSet<UserImportBatch> UserImportBatches => Set<UserImportBatch>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("organizations");

        builder.Entity<Organization>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).HasMaxLength(256).IsRequired();
            entity.Property(o => o.Region).HasMaxLength(128);
            entity.HasIndex(o => o.Name);
        });

        builder.Entity<AcademicYear>(entity =>
        {
            entity.HasKey(y => y.Id);
            entity.Property(y => y.Name).HasMaxLength(64).IsRequired();
            entity.HasOne<Organization>().WithMany().HasForeignKey(y => y.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(y => y.OrganizationId);
        });

        builder.Entity<ClassGroup>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Letter).HasMaxLength(8).IsRequired();
            entity.HasOne<Organization>().WithMany().HasForeignKey(c => c.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<AcademicYear>().WithMany().HasForeignKey(c => c.AcademicYearId).OnDelete(DeleteBehavior.Cascade);

            // Уникальность параллель+литера в рамках учебного года (план 09 §3.3, A2.3).
            entity.HasIndex(c => new { c.OrganizationId, c.AcademicYearId, c.Grade, c.Letter }).IsUnique();
        });

        builder.Entity<OrganizationMember>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Role).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(m => m.ExternalId).HasMaxLength(32);
            entity.HasOne<Organization>().WithMany().HasForeignKey(m => m.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ClassGroup>().WithMany().HasForeignKey(m => m.ClassGroupId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(m => new { m.OrganizationId, m.Role });
            entity.HasIndex(m => m.ClassGroupId);
            entity.HasIndex(m => m.UserId).IsUnique();

            // Сопоставление при повторном импорте (FR-CORE-08) — уникальность только среди
            // непустых значений: у ручного создания external_id не обязателен.
            entity.HasIndex(m => new { m.OrganizationId, m.ExternalId })
                .IsUnique()
                .HasFilter("external_id IS NOT NULL");
        });

        builder.Entity<UserImportBatch>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.FileName).HasMaxLength(256).IsRequired();
            entity.Property(b => b.Status).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(b => b.PreviewJson).HasColumnType("jsonb").IsRequired();
            entity.HasOne<Organization>().WithMany().HasForeignKey(b => b.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(b => b.OrganizationId);
        });
    }
}
