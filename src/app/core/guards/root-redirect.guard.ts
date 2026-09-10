import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Landing for `''`: staff → `/admin/dashboard`, everyone else (customers and anonymous) →
 * the public catalog. Replaces the old blanket `redirectTo: 'register'` that dumped
 * signed-in customers back on the registration form.
 */
export const rootRedirectGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  return router.createUrlTree([session.isEmployee() ? '/admin/dashboard' : '/products']);
};
