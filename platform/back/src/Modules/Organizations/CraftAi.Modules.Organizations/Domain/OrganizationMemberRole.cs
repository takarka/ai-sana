namespace CraftAi.Modules.Organizations.Domain;

/// <summary>
/// Роль учётной записи внутри школы. Только эти две — v0 «не раздаёт роли внутри школы
/// тоньше, чем один дефолтный <c>teacher</c>» (план 08, преамбула «Что этот срез НЕ делает»).
/// Не путать с <c>PlatformRoles</c> модуля Identity: это роль в рамках организации, а не
/// в контуре <c>platform</c>, и в claims JWT она не попадает.
/// </summary>
public enum OrganizationMemberRole
{
    Teacher,
    Student,
}
