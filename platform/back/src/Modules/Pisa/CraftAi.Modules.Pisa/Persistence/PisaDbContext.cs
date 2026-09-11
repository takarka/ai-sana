using CraftAi.Modules.Pisa.Domain;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Pisa.Persistence;

/// <summary>Схема <c>pisa</c> (план 01 §5: одна схема на модуль, snake_case).</summary>
public sealed class PisaDbContext(DbContextOptions<PisaDbContext> options) : DbContext(options)
{
    public DbSet<Item> Items => Set<Item>();

    public DbSet<ItemQuestion> ItemQuestions => Set<ItemQuestion>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema("pisa");

        builder.Entity<Item>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Stimulus).HasColumnType("jsonb").IsRequired();
            entity.Property(i => i.SearchText).IsRequired();
            entity.Property(i => i.Direction).HasConversion<string>().HasMaxLength(16).IsRequired();
            entity.Property(i => i.CognitiveProcess).HasMaxLength(128).IsRequired();
            entity.Property(i => i.Context).HasMaxLength(128).IsRequired();
            entity.HasIndex(i => new { i.Direction, i.Level });
            entity.HasIndex(i => new { i.GradeRangeMin, i.GradeRangeMax });
        });

        builder.Entity<ItemQuestion>(entity =>
        {
            entity.HasKey(q => q.Id);
            entity.Property(q => q.Type).HasConversion<string>().HasMaxLength(24).IsRequired();
            entity.Property(q => q.Payload).HasColumnType("jsonb").IsRequired();
            entity.Property(q => q.AnswerKey).HasColumnType("jsonb").IsRequired();
            entity.HasOne<Item>().WithMany().HasForeignKey(q => q.ItemId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(q => new { q.ItemId, q.Position });
        });
    }
}
