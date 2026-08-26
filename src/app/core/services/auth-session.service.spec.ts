import { TestBed } from '@angular/core/testing';
import { WA_LOCAL_STORAGE } from '@ng-web-apis/common';
import { AuthSessionService } from './auth-session.service';
import { AuthSession } from '../../domain/models/auth.model';

const SESSION: AuthSession = { accessToken: 'a', refreshToken: 'r', expiresAtUtc: '2026-08-26T00:00:00Z' };

function configureWith(storage: Storage | null): AuthSessionService {
  TestBed.configureTestingModule({
    providers: [{ provide: WA_LOCAL_STORAGE, useValue: storage }],
  });
  return TestBed.inject(AuthSessionService);
}

describe('AuthSessionService', () => {
  it('starts unauthenticated when storage is empty', () => {
    const service = configureWith(window.localStorage);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentSession()).toBeNull();
  });

  it('setSession persists to storage and flips isAuthenticated', () => {
    window.localStorage.clear();
    const service = configureWith(window.localStorage);

    service.setSession(SESSION);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentSession()).toEqual(SESSION);
    expect(JSON.parse(window.localStorage.getItem('omnihogar.auth.session')!)).toEqual(SESSION);
  });

  it('clearSession removes the stored session', () => {
    window.localStorage.setItem('omnihogar.auth.session', JSON.stringify(SESSION));
    const service = configureWith(window.localStorage);

    service.clearSession();

    expect(service.isAuthenticated()).toBe(false);
    expect(window.localStorage.getItem('omnihogar.auth.session')).toBeNull();
  });

  it('rehydrates an existing session from storage on construction', () => {
    window.localStorage.setItem('omnihogar.auth.session', JSON.stringify(SESSION));
    const service = configureWith(window.localStorage);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentSession()).toEqual(SESSION);
  });

  it('is SSR-safe when storage is null (no localStorage on the server)', () => {
    const service = configureWith(null);

    expect(() => service.setSession(SESSION)).not.toThrow();
    expect(service.isAuthenticated()).toBe(true);
  });
});
