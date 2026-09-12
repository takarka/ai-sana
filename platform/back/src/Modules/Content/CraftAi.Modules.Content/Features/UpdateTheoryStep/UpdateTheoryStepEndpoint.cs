using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.UpdateTheoryStep;

public static class UpdateTheoryStepEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPut("/lessons/{lessonId:guid}/steps/{stepId:guid}/theory", UpdateTheoryStepHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("UpdateTheoryStep");
}
