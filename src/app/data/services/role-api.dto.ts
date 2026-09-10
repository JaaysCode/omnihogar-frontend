/** Wire-shape DTOs — mirror the backend's JSON exactly (camelCase via System.Text.Json). */

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  /** Permission names granted by this role (HU-31). Absent on older payloads → treat as []. */
  permissions?: string[];
}

export interface PermissionDto {
  id: string;
  name: string;
  description: string | null;
}

/** Body for PUT /roles/{id}/permissions. */
export interface SetRolePermissionsRequestDto {
  permissions: string[];
}
