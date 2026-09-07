import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthSession } from '../../domain/models/auth.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Module-scoped (not per-call): while a refresh is in flight, every concurrent 401 awaits this
 * same call instead of each firing its own — standard single-flight refresh pattern. Cleared via
 * `finalize` once the refresh settles, so the next 401 starts a fresh attempt.
 */
let refreshInFlight$: Observable<AuthSession> | null = null;

function refreshSession(
  authRepository: AuthRepository,
  session: AuthSessionService,
  router: Router,
  refreshToken: string,
): Observable<AuthSession> {
  refreshInFlight$ ??= authRepository.refresh(refreshToken).pipe(
    tap((newSession) => session.setSession(newSession)),
    catchError((error: unknown) => {
      // Refresh token expired/revoked too — there's no way back short of a real login.
      session.clearSession();
      void router.navigateByUrl('/login');
      return throwError(() => error);
    }),
    finalize(() => {
      refreshInFlight$ = null;
    }),
    shareReplay(1),
  );
  return refreshInFlight$;
}

/**
 * Attaches the stored session's access token as a Bearer header, and transparently recovers
 * from an expired one: a 401 on any non-`/auth/` request triggers a refresh (shared across
 * concurrent 401s via `refreshSession`), then retries the original request with the new token.
 * If the refresh itself fails, the session is cleared and the user is sent to `/login` — no more
 * silently stuck on a dead token forever.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const authRepository = inject(AuthRepository);
  const router = inject(Router);

  const token = session.currentSession()?.accessToken;
  const authorizedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  // login/register/refresh never trigger a refresh-and-retry loop: a 401 there means bad
  // credentials or a dead refresh token, not an expired access token.
  if (req.url.includes('/auth/')) {
    return next(authorizedReq);
  }

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = session.currentSession()?.refreshToken;
      if (!refreshToken) {
        session.clearSession();
        void router.navigateByUrl('/login');
        return throwError(() => error);
      }

      return refreshSession(authRepository, session, router, refreshToken).pipe(
        switchMap((newSession) => next(req.clone({ setHeaders: { Authorization: `Bearer ${newSession.accessToken}` } }))),
        catchError(() => throwError(() => error)),
      );
    }),
  );
};
