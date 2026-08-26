import { Injectable, inject, signal } from '@angular/core';
import { WA_LOCAL_STORAGE } from '@ng-web-apis/common';
import { AuthSession } from '../../domain/models/auth.model';

const STORAGE_KEY = 'omnihogar.auth.session';

/**
 * Persists the authenticated session (tokens from register/login) to localStorage and
 * exposes it reactively. `WA_LOCAL_STORAGE` is null during SSR, so every access is guarded.
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly storage = inject(WA_LOCAL_STORAGE);

  private readonly session = signal<AuthSession | null>(this.readFromStorage());
  readonly isAuthenticated = signal(this.session() !== null);

  currentSession(): AuthSession | null {
    return this.session();
  }

  setSession(session: AuthSession): void {
    this.session.set(session);
    this.isAuthenticated.set(true);
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    this.session.set(null);
    this.isAuthenticated.set(false);
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
