using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.UpdateTaskStep;

public static class UpdateTaskStepEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPut("/lessons/{lessonId:guid}/steps/{stepId:guid}/task", UpdateTaskStepHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("UpdateTaskStep");
}
