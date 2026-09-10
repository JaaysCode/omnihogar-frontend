import { HttpErrorResponse } from '@angular/common/http';
import { Permission, Role, RoleApiError, RoleFieldErrors } from '../../domain/models/role.model';
import { ApiProblemDto } from '../services/auth-api.dto';
import { PermissionDto, RoleDto } from '../services/role-api.dto';

export function toRole(dto: RoleDto): Role {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    permissions: dto.permissions ?? [],
  };
}

export function toPermission(dto: PermissionDto): Permission {
  return { id: dto.id, name: dto.name, description: dto.description };
}

/** Lowercases the backend's PascalCase field-error keys (e.g. "RoleId" -> "roleId"). */
function toFieldErrors(errors: Record<string, string[]>): RoleFieldErrors {
  const normalized: RoleFieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link RoleApiError}. */
export function toRoleApiError(error: unknown): RoleApiError {
  const generic = $localize`:@@roles.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`;

  if (!(error instanceof HttpErrorResponse)) {
    return new RoleApiError(generic);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new RoleApiError(
      fieldErrors
        ? Object.values(fieldErrors)[0]?.[0] ?? $localize`:@@roles.error.validation:Hay datos que corregir.`
        : problem?.title ?? $localize`:@@roles.error.validation:Hay datos que corregir.`,
      fieldErrors,
    );
  }

  if (error.status === 401 || error.status === 403) {
    return new RoleApiError(
      $localize`:@@roles.error.forbidden:No tienes permisos para gestionar roles.`,
    );
  }

  if (error.status === 404) {
    return new RoleApiError($localize`:@@roles.error.notFound:El rol solicitado no existe.`);
  }

  if (error.status === 0) {
    return new RoleApiError(
      $localize`:@@roles.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new RoleApiError(generic);
}
