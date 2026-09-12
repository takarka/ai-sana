using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.DeleteStep;

public static class DeleteStepEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapDelete("/lessons/{lessonId:guid}/steps/{stepId:guid}", DeleteStepHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("DeleteStep");
}
