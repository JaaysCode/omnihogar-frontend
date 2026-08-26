import { HttpErrorResponse } from '@angular/common/http';
import { EmployeeApiError, FieldErrors, Role } from '../../domain/models/employee.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { RoleDto } from '../services/employee-api.dto';

export function toRole(dto: RoleDto): Role {
  return { id: dto.id, name: dto.name, description: dto.description };
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
  if (!(error instanceof HttpErrorResponse)) {
    return new EmployeeApiError('Something went wrong. Please try again.');
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new EmployeeApiError(problem?.title ?? 'Some fields need to be corrected.', fieldErrors);
  }

  if (error.status === 401 || error.status === 403) {
    return new EmployeeApiError('You do not have permission to create employee accounts.');
  }

  if (error.status === 0) {
    return new EmployeeApiError('Could not reach the server. Check your connection and try again.');
  }

  return new EmployeeApiError('Something went wrong. Please try again.');
}
