import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthRepositoryImpl } from './auth.repository.impl';
import { AuthApiService } from '../services/auth-api.service';
import { AuthApiError } from '../../domain/models/auth.model';

describe('AuthRepositoryImpl', () => {
  let repository: AuthRepositoryImpl;
  let api: { register: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = { register: vi.fn(), login: vi.fn() };
    TestBed.configureTestingModule({
      providers: [AuthRepositoryImpl, { provide: AuthApiService, useValue: api }],
    });
    repository = TestBed.inject(AuthRepositoryImpl);
  });

  it('maps a successful register response to a domain AuthSession', () => {
    api.register.mockReturnValue(
      of({ accessToken: 'a', refreshToken: 'r', expiresAtUtc: '2026-08-26T00:00:00Z' }),
    );

    let session;
    repository
      .register({ email: 'jane@example.com', password: 'Passw0rd!', firstName: 'Jane', lastName: 'Doe' })
      .subscribe((s) => (session = s));

    expect(session).toEqual({ accessToken: 'a', refreshToken: 'r', expiresAtUtc: '2026-08-26T00:00:00Z' });
  });

  it('translates a failed register call into an AuthApiError', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, title: 'Validation failed', errors: { Email: ['Email is already registered.'] } },
          }),
      ),
    );

    let caught: AuthApiError | undefined;
    repository
      .register({ email: 'jane@example.com', password: 'Passw0rd!', firstName: 'Jane', lastName: 'Doe' })
      .subscribe({ error: (err) => (caught = err) });

    expect(caught).toBeInstanceOf(AuthApiError);
    expect(caught?.fieldErrors).toEqual({ email: ['Email is already registered.'] });
  });

  it('translates a failed login call into an AuthApiError', () => {
    api.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    let caught: AuthApiError | undefined;
    repository
      .login({ email: 'jane@example.com', password: 'wrong' })
      .subscribe({ error: (err) => (caught = err) });

    expect(caught?.message).toBe('Correo o contraseña incorrectos.');
  });
});
