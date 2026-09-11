using CraftAi.Modules.Content.Domain;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Persistence;

/// <summary>Схема <c>content</c> (план 01 §5: одна схема на модуль, snake_case).</summary>
public sealed class ContentDbContext(DbContextOptions<ContentDbContext> options) : DbContext(options)
{
    public DbSet<Section> Sections => Set<Section>();

    public DbSet<Lesson> Lessons => Set<Lesson>();

    public DbSet<LessonStep> LessonSteps => Set<LessonStep>();

    public DbSet<StepMaterial> StepMaterials => Set<StepMaterial>();

    public DbSet<Question> Questions => Set<Question>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("content");

        builder.Entity<Section>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Name).HasMaxLength(256).IsRequired();
            entity.HasIndex(s => s.Grade);
        });

        builder.Entity<Lesson>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.Property(l => l.Title).HasMaxLength(256).IsRequired();
            entity.HasOne<Section>().WithMany().HasForeignKey(l => l.SectionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(l => l.SectionId);
        });

        builder.Entity<LessonStep>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Type).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.HasOne<Lesson>().WithMany().HasForeignKey(s => s.LessonId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(s => new { s.LessonId, s.Position });
        });

        builder.Entity<StepMaterial>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Type).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(m => m.Content).IsRequired();
            entity.HasOne<LessonStep>().WithMany().HasForeignKey(m => m.LessonStepId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(m => new { m.LessonStepId, m.Position });
        });

        builder.Entity<Question>(entity =>
        {
            entity.HasKey(q => q.Id);
            entity.Property(q => q.Type).HasConversion<string>().HasMaxLength(24).IsRequired();
            entity.Property(q => q.Payload).HasColumnType("jsonb").IsRequired();
            entity.Property(q => q.AnswerKey).HasColumnType("jsonb").IsRequired();
            entity.HasOne<LessonStep>().WithMany().HasForeignKey(q => q.LessonStepId).OnDelete(DeleteBehavior.Cascade);

            // Ровно один вопрос на шаг типа task в v0 (план 09 §3.4).
            entity.HasIndex(q => q.LessonStepId).IsUnique();
        });
    }
}
