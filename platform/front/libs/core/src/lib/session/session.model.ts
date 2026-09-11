// Зеркало CraftAi.Modules.Identity.Features.Profile.GetCurrentUser.GetCurrentUserResponse.
export interface SessionProfile {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly preferredLanguage: string;
  readonly roles: readonly string[];
  readonly mustChangePassword: boolean;
}

// Роли контура platform — план 08 §2, PlatformRoles на бэкенде.
export const PLATFORM_ROLES = {
  SuperAdmin: 'superadmin',
  Author: 'author',
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];
