/** Own-account profile (HU-16) — same shape for every role. */
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

/** Payload for PUT /profile. Email change here is unverified (no confirmation flow) — see
 * `ProfileRepository` doc. */
export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

/** Per-field validation messages, keyed by camelCase field name (e.g. "firstName"). */
export type FieldErrors = Record<string, string[]>;

/**
 * Normalized error thrown by the profile data layer. `fieldErrors` is populated for
 * 400 (validation) responses; absent for generic failures (e.g. 401, 404, 500).
 */
export class ProfileApiError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'ProfileApiError';
  }
}
