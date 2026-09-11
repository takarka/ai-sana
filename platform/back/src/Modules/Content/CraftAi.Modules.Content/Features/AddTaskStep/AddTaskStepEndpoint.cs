using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.AddTaskStep;

public static class AddTaskStepEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPost("/lessons/{lessonId:guid}/steps/task", AddTaskStepHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("AddTaskStep");
}
