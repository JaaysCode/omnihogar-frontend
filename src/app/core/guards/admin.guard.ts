import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';
import { decodeJwtRoles } from '../../shared/utils/jwt-roles';

/**
 * Blocks anonymous visitors and non-admin users from admin-only routes (e.g. employee
 * creation), redirecting to `/`. Client-side gate only — the real enforcement is the
 * backend's `[Authorize(Roles = "Admin")]`.
 */
export const adminGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService).currentSession();
  const roles = session ? decodeJwtRoles(session.accessToken) : [];

  if (roles.includes('Admin')) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};
