/** Payload for POST /employees. */
export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  roleId: string;
}

/** Assignable role, from GET /roles. */
export interface Role {
  id: string;
  name: string;
  description: string | null;
}

/** Row shape for the "Gestión de Usuarios" list, from GET /employees. */
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  /** Null if the account somehow has no role assigned yet. */
  roleName: string | null;
  status: boolean;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "email"). */
export type FieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the employee data layer. `fieldErrors` is populated for
 * 400 (validation / duplicate email) responses; absent for generic failures (e.g. 401, 403, 500).
 */
export class EmployeeApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'EmployeeApiError';
  }
}
