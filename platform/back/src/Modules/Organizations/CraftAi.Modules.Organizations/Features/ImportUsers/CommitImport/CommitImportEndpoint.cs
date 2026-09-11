using CraftAi.Modules.Identity.Contracts;
using CraftAi.SharedKernel.Http.Idempotency;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace CraftAi.Modules.Organizations.Features.ImportUsers.CommitImport;

public static class CommitImportEndpoint
{
    public static void Map(IEndpointRouteBuilder import) =>
        import.MapPost("/{batchId:guid}/commit", CommitImportHandler.HandleAsync)
            .RequireAuthorization(PlatformPolicyNames.Admin)
            .RequireIdempotencyKey()
            .WithName("CommitImportUsers");
}
