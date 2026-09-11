using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.UpdateLesson;

public static class UpdateLessonEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPut("/lessons/{lessonId:guid}", UpdateLessonHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("UpdateLesson");
}
