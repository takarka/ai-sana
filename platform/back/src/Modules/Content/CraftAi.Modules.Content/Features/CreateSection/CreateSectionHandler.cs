using CraftAi.Modules.Content.Domain;
using CraftAi.Modules.Content.Persistence;
using CraftAi.SharedKernel;
using CraftAi.SharedKernel.Http.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CraftAi.Modules.Content.Features.CreateSection;

internal static class CreateSectionHandler
{
    public static async Task<IResult> HandleAsync(
        CreateSectionRequest request, HttpContext httpContext, ContentDbContext db,
        TimeProvider timeProvider, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result.Failure<SectionResponse>(
                Error.Validation("section.name-required", "Название раздела обязательно.")).ToApiResult(httpContext);
        }

        if (request.Grade is < 1 or > 11)
        {
            return Result.Failure<SectionResponse>(
                Error.Validation("section.invalid-grade", "Параллель должна быть от 1 до 11.")).ToApiResult(httpContext);
        }

        var position = await db.Sections.Where(s => s.Grade == request.Grade).CountAsync(cancellationToken);

        var section = new Section
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Grade = request.Grade,
            Position = position,
            CreatedAtUtc = timeProvider.GetUtcNow(),
        };

        db.Sections.Add(section);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(new SectionResponse(section.Id, section.Name, section.Grade, section.Position))
            .ToApiResult(httpContext, value => Results.Created($"/platform/content/matrix/sections/{value.Id}", value));
    }
}
