import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Route gate: passes when the session holds at least one of `required` permissions.
 * Anonymous → `/login`; signed in but missing the permission → `/` (its redirect sends
 * staff to the dashboard and everyone else to the catalog). UI gate only — the backend's
 * `[Authorize(Policy=...)]` is the real enforcement.
 */
export function permissionGuard(...required: string[]): CanActivateFn {
  return () => {
    const session = inject(AuthSessionService);
    const router = inject(Router);

    if (!session.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (session.hasPermission(...required)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}
