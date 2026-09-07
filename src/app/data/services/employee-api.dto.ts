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
}

export interface EmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
  status: boolean;
}
