namespace CraftAi.Modules.Content.Features.AddTheoryStep;

/// <param name="Type">"video" | "text" | "image" | "file".</param>
public sealed record MaterialInput(string Type, string Content);

public sealed record AddTheoryStepRequest(IReadOnlyList<MaterialInput> Materials);
