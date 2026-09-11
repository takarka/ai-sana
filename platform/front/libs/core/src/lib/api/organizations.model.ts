// Зеркала DTO CraftAi.Modules.Organizations.Features.* (план 09 §3.3).

export interface OrganizationSummary {
  readonly id: string;
  readonly name: string;
  readonly region: string | null;
  readonly createdAtUtc: string;
}

export interface ListOrganizationsResponse {
  readonly items: readonly OrganizationSummary[];
  readonly totalCount: number;
}

export interface CreateOrganizationRequest {
  readonly name: string;
  readonly region?: string | null;
}

export interface CreateOrganizationResponse {
  readonly id: string;
  readonly name: string;
  readonly region: string | null;
  readonly academicYearId: string;
  readonly academicYearName: string;
}

export interface GetOrganizationResponse {
  readonly id: string;
  readonly name: string;
  readonly region: string | null;
  readonly createdAtUtc: string;
  readonly currentAcademicYearId: string;
  readonly currentAcademicYearName: string;
}

export interface ClassGroupResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly academicYearId: string;
  readonly grade: number;
  readonly letter: string;
}

export interface CreateClassGroupRequest {
  readonly grade: number;
  readonly letter: string;
}

export type OrganizationMemberRole = 'teacher' | 'student';

export interface CreateUserAccountRequest {
  readonly fullName: string;
  readonly role: OrganizationMemberRole;
  readonly classGroupId?: string | null;
}

export interface CreateUserAccountResponse {
  readonly memberId: string;
  readonly userId: string;
  readonly login: string;
  readonly generatedPassword: string;
  readonly role: string;
  readonly classGroupId: string | null;
}

export interface UserAccountSummary {
  readonly memberId: string;
  readonly userId: string;
  readonly fullName: string;
  readonly login: string;
  readonly role: string;
  readonly classGroupId: string | null;
  readonly externalId: string | null;
  readonly mustChangePassword: boolean;
}
