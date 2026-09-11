using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Content.Features.AddTheoryStep;

public static class AddTheoryStepEndpoint
{
    public static void Map(IEndpointRouteBuilder matrix) =>
        matrix.MapPost("/lessons/{lessonId:guid}/steps/theory", AddTheoryStepHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Content)
            .RequireIdempotencyKey()
            .WithName("AddTheoryStep");
}
