/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface CreateEmployeeRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  roleId: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  /** Permission names granted by this role (HU-31). Absent on older payloads → treat as []. */
  permissions?: string[];
}

export interface EmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
  /** Id of the assigned role (HU-31) — null if none. */
  roleId: string | null;
  status: boolean;
}

/** Body for PUT /employees/{id}/role. */
export interface SetEmployeeRoleRequestDto {
  roleId: string;
}
