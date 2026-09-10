/**
 * A business role and the permissions it grants (HU-31). Shared by the employee feature
 * (role picker) and the role-management pages.
 */
export interface Role {
  id: string;
  name: string;
  description: string | null;
  /** Permission names this role grants. Empty for a role with none. */
  permissions: string[];
}

/** One entry of the permission catalogue, from GET /roles/permissions (HU-31). */
export interface Permission {
  id: string;
  name: string;
  /** Human-readable label, already in Spanish from the backend seed. */
  description: string | null;
}

/** Id of the seeded "Administrador" role — it always holds every permission and can't be edited. */
export const ADMINISTRADOR_ROLE_ID = '11111111-1111-1111-1111-111111111111';

/** Per-field validation messages, keyed by camelCase field name. */
export type RoleFieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the role data layer. `fieldErrors` is populated for 400
 * responses; absent for generic failures (401/403/404/500/offline).
 */
export class RoleApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: RoleFieldErrors,
  ) {
    super(message);
    this.name = 'RoleApiError';
  }
}
