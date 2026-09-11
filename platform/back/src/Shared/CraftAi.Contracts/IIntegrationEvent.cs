namespace CraftAi.Contracts;

/// <summary>
/// Базовый контракт интеграционного события — того, чем модули сообщают друг другу
/// о свершившемся факте, не зная о внутренностях друг друга (план 01 §3: модуль
/// ссылается только на <c>*.Contracts</c> другого модуля, никогда на его реализацию).
/// Конкретные события объявляются в <c>Contracts</c>-проекте модуля-источника,
/// например <c>CraftAi.Modules.Organizations.Contracts.Events.OrganizationCreated</c>.
/// </summary>
public interface IIntegrationEvent
{
    DateTimeOffset OccurredAtUtc { get; }
}
