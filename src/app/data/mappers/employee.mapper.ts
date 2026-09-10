import { HttpErrorResponse } from '@angular/common/http';
import { Employee, EmployeeApiError, FieldErrors } from '../../domain/models/employee.model';
import { Role } from '../../domain/models/role.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { EmployeeDto, RoleDto } from '../services/employee-api.dto';

export function toRole(dto: RoleDto): Role {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    permissions: dto.permissions ?? [],
  };
}

export function toEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    fullName: `${dto.firstName} ${dto.lastName}`,
    email: dto.email,
    roleName: dto.roleName,
    roleId: dto.roleId,
    status: dto.status,
  };
}

/** Lowercases the backend's PascalCase field-error keys (e.g. "Email" -> "email"). */
function toFieldErrors(errors: Record<string, string[]>): FieldErrors {
  const normalized: FieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link EmployeeApiError}. */
export function toEmployeeApiError(error: unknown): EmployeeApiError {
  const generic = $localize`:@@employees.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`;

  if (!(error instanceof HttpErrorResponse)) {
    return new EmployeeApiError(generic);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new EmployeeApiError(
      problem?.title ?? $localize`:@@employees.error.validation:Hay campos que corregir.`,
      fieldErrors,
    );
  }

  if (error.status === 401 || error.status === 403) {
    return new EmployeeApiError(
      $localize`:@@employees.error.forbidden:No tienes permisos para gestionar cuentas de empleados.`,
    );
  }

  if (error.status === 404) {
    return new EmployeeApiError($localize`:@@employees.error.notFound:El empleado solicitado no existe.`);
  }

  if (error.status === 0) {
    return new EmployeeApiError(
      $localize`:@@employees.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new EmployeeApiError(generic);
}
