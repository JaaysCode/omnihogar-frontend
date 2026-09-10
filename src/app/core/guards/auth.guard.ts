import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/** Requires a signed-in session; anonymous visitors go to `/login`. */
export const authGuard: CanActivateFn = () => {
  if (inject(AuthSessionService).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};
