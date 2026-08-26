/** Payload for POST /auth/register. */
export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

/** Payload for POST /auth/login. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Authenticated session returned by the backend on register/login. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "email"). */
export type FieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the auth data layer. `fieldErrors` is populated for
 * 400 (validation / duplicate email) responses; absent for generic failures (e.g. 401, 500).
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}
