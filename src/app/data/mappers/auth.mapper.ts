import { HttpErrorResponse } from '@angular/common/http';
import { AuthApiError, AuthSession, FieldErrors } from '../../domain/models/auth.model';
import { ApiProblemDto, AuthResponseDto } from '../services/auth-api.dto';

export function toAuthSession(dto: AuthResponseDto): AuthSession {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAtUtc: dto.expiresAtUtc,
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

/** Translates a failed HTTP call into a domain-level {@link AuthApiError}. */
export function toAuthApiError(error: unknown): AuthApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return new AuthApiError('Something went wrong. Please try again.');
  }

  if (error.status === 400) {
    const problem = error.error as ApiProblemDto | null;
    const fieldErrors = problem?.errors ? toFieldErrors(problem.errors) : undefined;
    return new AuthApiError(problem?.title ?? 'Some fields need to be corrected.', fieldErrors);
  }

  if (error.status === 401) {
    return new AuthApiError('Invalid email or password.');
  }

  if (error.status === 0) {
    return new AuthApiError('Could not reach the server. Check your connection and try again.');
  }

  return new AuthApiError('Something went wrong. Please try again.');
}
