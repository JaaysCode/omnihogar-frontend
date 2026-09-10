// Matches TokenService.cs: roles are `new Claim(ClaimTypes.Role, role)` — that serializes
// to the URI key below, not a short "role" key. Permissions are `new Claim("permission", p)`.
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const PERMISSION_CLAIM = 'permission';

/**
 * Not signature-verified — purely a UI-gating read; the backend's `[Authorize(Policy=...)]`
 * is what actually enforces access.
 */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readStringClaim(claims: Record<string, unknown> | null, key: string): string[] {
  const value = claims?.[key];
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as string[]) : [value as string];
}

/** Role names from the JWT payload (e.g. `["Administrador"]`). */
export function decodeJwtRoles(token: string): string[] {
  return readStringClaim(decodePayload(token), ROLE_CLAIM);
}

/** Permission names from the JWT payload (e.g. `["inventario.consultar", ...]`). */
export function decodeJwtPermissions(token: string): string[] {
  return readStringClaim(decodePayload(token), PERMISSION_CLAIM);
}
