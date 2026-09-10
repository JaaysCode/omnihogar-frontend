import { Injectable, computed, inject, signal } from '@angular/core';
import { WA_LOCAL_STORAGE } from '@ng-web-apis/common';
import { AuthSession } from '../../domain/models/auth.model';
import { decodeJwtPermissions, decodeJwtRoles } from '../../shared/utils/jwt-claims';

const STORAGE_KEY = 'omnihogar.auth.session';

/**
 * Persists the authenticated session (tokens from register/login) to localStorage and
 * exposes it reactively. `WA_LOCAL_STORAGE` is null during SSR, so every access is guarded.
 *
 * Roles/permissions are read (unverified) from the access-token payload — a UI gate only;
 * the backend's `[Authorize(Policy=...)]` is the real enforcement.
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly storage = inject(WA_LOCAL_STORAGE);

  private readonly session = signal<AuthSession | null>(this.readFromStorage());
  readonly isAuthenticated = computed(() => this.session() !== null);

  readonly roles = computed(() => {
    const s = this.session();
    return s ? decodeJwtRoles(s.accessToken) : [];
  });

  readonly permissions = computed(() => {
    const s = this.session();
    return s ? decodeJwtPermissions(s.accessToken) : [];
  });

  /** Any role other than `Cliente` — i.e. a staff account that belongs in the admin area. */
  readonly isEmployee = computed(() => this.roles().some((r) => r !== 'Cliente'));

  currentSession(): AuthSession | null {
    return this.session();
  }

  /** True if the session carries at least one of `required` (or `required` is empty). */
  hasPermission(...required: string[]): boolean {
    if (required.length === 0) {
      return true;
    }
    const held = this.permissions();
    return required.some((r) => held.includes(r));
  }

  setSession(session: AuthSession): void {
    this.session.set(session);
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    this.session.set(null);
    this.storage?.removeItem(STORAGE_KEY);
  }

  private readFromStorage(): AuthSession | null {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }
}
