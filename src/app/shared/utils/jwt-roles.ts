// Matches TokenService.cs: `new Claim(ClaimTypes.Role, role)` — ClaimTypes.Role serializes
// to this URI key in the JWT, not a short "role" key.
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/**
 * Reads role names out of a JWT's payload. Not signature-verified — purely a UI-gating
 * read; the backend's `[Authorize(Roles=...)]` is what actually enforces access.
 *
 * Shared by `adminGuard` (blocking navigation) and `AuthPage` (post-login redirect).
 */
export function decodeJwtRoles(token: string): string[] {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const claims = JSON.parse(json) as Record<string, unknown>;
    const role = claims[ROLE_CLAIM];
    if (!role) {
      return [];
    }
    return Array.isArray(role) ? (role as string[]) : [role as string];
  } catch {
    return [];
  }
}
