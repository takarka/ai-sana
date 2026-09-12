namespace CraftAi.Modules.Content.Features.ReorderSteps;

/// <param name="StepIds">Полный набор id шагов урока в новом порядке — план 09 §3.4.</param>
public sealed record ReorderStepsRequest(IReadOnlyList<Guid> StepIds);
