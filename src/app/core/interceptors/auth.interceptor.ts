import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Attaches the stored session's access token as a Bearer header. Only endpoints that
 * actually require auth (e.g. POST /employees) check it — everything else ignores it.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthSessionService).currentSession()?.accessToken;

  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
