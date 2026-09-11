using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.CreateLesson;

public static class CreateLessonEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPost("/lessons", CreateLessonHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("CreateLesson");
}
