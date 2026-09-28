import { HttpErrorResponse } from '@angular/common/http';
import { FieldErrors, Profile, ProfileApiError } from '../../domain/models/profile.model';
import { ApiProblemDto, ProfileResponseDto } from '../services/profile-api.dto';

export function toProfile(dto: ProfileResponseDto): Profile {
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    createdAt: dto.createdAt,
  };
}

/** Lowercases the backend's PascalCase field-error keys (e.g. "FirstName" -> "firstName"). */
function toFieldErrors(errors: Record<string, string[]>): FieldErrors {
  const normalized: FieldErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[fieldName] = messages;
  }
  return normalized;
}

/** Translates a failed HTTP call into a domain-level {@link ProfileApiError}. */
export function toProfileApiError(error: unknown): ProfileApiError {
  const generic = $localize`:@@profile.error.generic:Ocurrió un error inesperado. Inténtalo de nuevo.`;

  if (!(error instanceof HttpErrorResponse)) {
    return new ProfileApiError(generic);
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new ProfileApiError(
      problem?.title ?? $localize`:@@profile.error.validation:Hay campos que corregir.`,
      fieldErrors,
    );
  }

  if (error.status === 401) {
    return new ProfileApiError($localize`:@@profile.error.unauthorized:Tu sesión expiró. Inicia sesión de nuevo.`);
  }

  if (error.status === 404) {
    return new ProfileApiError($localize`:@@profile.error.notFound:Tu cuenta ya no existe.`);
  }

  if (error.status === 0) {
    return new ProfileApiError(
      $localize`:@@profile.error.offline:No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.`,
    );
  }

  return new ProfileApiError(generic);
}
