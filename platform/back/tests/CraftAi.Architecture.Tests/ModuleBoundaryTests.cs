using System.Reflection;

namespace CraftAi.Architecture.Tests;

/// <summary>
/// Правило плана 01 §3: «CraftAi.Modules.A может ссылаться на CraftAi.Modules.B.Contracts,
/// но никогда на CraftAi.Modules.B». Первая реальная межмодульная зависимость появилась в
/// A2 (план 09 §3.3): <c>Organizations</c> заводит учётные записи через
/// <c>Identity.Contracts.IUserProvisioningService</c>, не касаясь реализации Identity.
/// A3 (план 09 §3.5) добавляет вторую: <c>Content</c> проверяет структуру вопроса через
/// <c>Assessment.Contracts.IQuestionValidationService</c>.
///
/// Проверяется на уровне ССЫЛОК СБОРОК, а не через NetArchTest.Rules по неймспейсам:
/// «CraftAi.Modules.Identity» — префикс «CraftAi.Modules.Identity.Contracts», поэтому
/// любая проверка по префиксу строки namespace ложно сработала бы и на легитимную ссылку
/// на Contracts. У сборок имена сравниваются точно, такой двусмысленности нет.
/// </summary>
public sealed class ModuleBoundaryTests
{
    private static readonly Assembly IdentityAssembly = typeof(Modules.Identity.IdentityModule).Assembly;
    private static readonly Assembly OrganizationsAssembly = typeof(Modules.Organizations.OrganizationsModule).Assembly;
    private static readonly Assembly AssessmentAssembly = typeof(Modules.Assessment.AssessmentModule).Assembly;
    private static readonly Assembly ContentAssembly = typeof(Modules.Content.ContentModule).Assembly;

    [Theory]
    [MemberData(nameof(ForbiddenDependencies))]
    public void Модуль_НеДолженСсылатьсяНаРеализациюДругогоМодуля(Assembly consumer, Assembly forbiddenImplementation)
    {
        var referencedAssemblyNames = consumer.GetReferencedAssemblies().Select(a => a.Name).ToArray();

        Assert.DoesNotContain(forbiddenImplementation.GetName().Name, referencedAssemblyNames);
    }

    public static IEnumerable<object[]> ForbiddenDependencies()
    {
        yield return [OrganizationsAssembly, IdentityAssembly];
        yield return [ContentAssembly, AssessmentAssembly];
    }
}
