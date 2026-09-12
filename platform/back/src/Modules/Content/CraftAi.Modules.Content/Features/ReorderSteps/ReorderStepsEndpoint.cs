using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.ReorderSteps;

public static class ReorderStepsEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPut("/lessons/{lessonId:guid}/steps/reorder", ReorderStepsHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("ReorderSteps");
}
