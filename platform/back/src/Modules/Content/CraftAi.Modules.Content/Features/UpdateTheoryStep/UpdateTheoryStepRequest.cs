using CraftAi.Modules.Content.Features.AddTheoryStep;

namespace CraftAi.Modules.Content.Features.UpdateTheoryStep;

public sealed record UpdateTheoryStepRequest(IReadOnlyList<MaterialInput> Materials);
