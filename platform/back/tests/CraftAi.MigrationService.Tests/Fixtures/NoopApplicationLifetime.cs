using Microsoft.Extensions.Hosting;

namespace CraftAi.MigrationService.Tests.Fixtures;

/// <summary>
/// Тестовый двойник: фиксирует вызов StopApplication() и даёт тесту дождаться его,
/// не полагаясь на гонку между BackgroundService.StartAsync (который планирует
/// ExecuteAsync на пуле потоков, не дожидаясь его) и StopAsync.
/// </summary>
public sealed class NoopApplicationLifetime : IHostApplicationLifetime
{
    private readonly CancellationTokenSource _stopping = new();
    private readonly TaskCompletionSource _stopApplicationCalled =
        new(TaskCreationOptions.RunContinuationsAsynchronously);

    public bool StopApplicationCalled { get; private set; }

    public CancellationToken ApplicationStarted => CancellationToken.None;

    public CancellationToken ApplicationStopping => _stopping.Token;

    public CancellationToken ApplicationStopped => CancellationToken.None;

    public Task WaitForStopApplicationAsync(TimeSpan timeout) =>
        _stopApplicationCalled.Task.WaitAsync(timeout);

    public void StopApplication()
    {
        StopApplicationCalled = true;
        _stopApplicationCalled.TrySetResult();
        _stopping.Cancel();
    }
}
