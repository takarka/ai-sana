using System.Reflection;
using CraftAi.Contracts;
using CraftAi.SharedKernel;
using NetArchTest.Rules;

namespace CraftAi.Architecture.Tests;

/// <summary>
/// Направление зависимостей из плана 01 §3: общий код (SharedKernel, Contracts,
/// ServiceDefaults) не знает о хостах (Api, MigrationService) — хосты зависят от
/// общего кода, а не наоборот. Модульное правило («модуль ссылается только на
/// *.Contracts другого модуля») — в <see cref="ModuleBoundaryTests"/>, начиная с A2.
/// </summary>
public sealed class DependencyDirectionTests
{
    private static readonly Assembly SharedKernelAssembly = typeof(Error).Assembly;
    private static readonly Assembly ContractsAssembly = typeof(IIntegrationEvent).Assembly;
    private static readonly Assembly ServiceDefaultsAssembly = typeof(ServiceDefaults.Extensions).Assembly;

    [Theory]
    [MemberData(nameof(SharedAssemblies))]
    public void SharedAssembly_ДолженНеЗависетьОтХостов(Assembly sharedAssembly)
    {
        var result = Types.InAssembly(sharedAssembly)
            .Should()
            .NotHaveDependencyOnAny("CraftAi.Api", "CraftAi.MigrationService")
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailures(result));
    }

    [Fact]
    public void Contracts_ДолженНеЗависетьОтДругихПроектовПлатформы()
    {
        var result = Types.InAssembly(ContractsAssembly)
            .Should()
            .NotHaveDependencyOnAny(
                "CraftAi.SharedKernel",
                "CraftAi.ServiceDefaults",
                "CraftAi.Api",
                "CraftAi.MigrationService")
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailures(result));
    }

    public static IEnumerable<object[]> SharedAssemblies()
    {
        yield return [SharedKernelAssembly];
        yield return [ContractsAssembly];
        yield return [ServiceDefaultsAssembly];
    }

    private static string FormatFailures(TestResult result) =>
        result.FailingTypeNames is null
            ? "нет деталей"
            : string.Join(", ", result.FailingTypeNames);
}
