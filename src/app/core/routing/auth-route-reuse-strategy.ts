import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { AuthPage } from '../../presentation/pages/auth-page/auth-page';

/**
 * Keeps the same `AuthPage` component instance alive across the `/register` <-> `/login`
 * navigation instead of Angular's default destroy-and-recreate. That persistence is what lets
 * the mode switch be animated with a plain CSS `transform` transition (see auth-page.scss) —
 * a transition needs a continuous element to interpolate, which a fresh instance never is.
 * Every other route falls back to Angular's default same-route-config check.
 */
export class AuthRouteReuseStrategy implements RouteReuseStrategy {
  shouldDetach(): boolean {
    return false;
  }

  store(): void {
    // no-op: we never detach (shouldDetach is always false), so nothing to store.
  }

  shouldAttach(): boolean {
    return false;
  }

  retrieve(): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig?.component === AuthPage && curr.routeConfig?.component === AuthPage) {
      return true;
    }
    return future.routeConfig === curr.routeConfig;
  }
}
