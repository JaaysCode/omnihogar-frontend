import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthPage } from './auth-page';
import { RegisterForm } from '../../components/register-form/register-form';
import { LoginForm } from '../../components/login-form/login-form';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { AuthApiError, AuthSession, RegisterPayload } from '../../../domain/models/auth.model';

const SESSION: AuthSession = { accessToken: 'a', refreshToken: 'r', expiresAtUtc: '2026-08-26T00:00:00Z' };

const VALID_REGISTER_PAYLOAD: RegisterPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'Passw0rd!',
};

describe('AuthPage', () => {
  let fixture: ComponentFixture<AuthPage>;
  let authRepository: { register: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authRepository = { register: vi.fn(), login: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: AuthRepository, useValue: authRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPage);
  });

  function registerFormInstance(): RegisterForm {
    return fixture.debugElement.query(By.directive(RegisterForm)).componentInstance;
  }

  function loginFormInstance(): LoginForm {
    return fixture.debugElement.query(By.directive(LoginForm)).componentInstance;
  }

  it('defaults to the register mode and shows the register heading', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Join OmniHogar');
    expect(fixture.debugElement.query(By.directive(RegisterForm))).toBeTruthy();
  });

  it('shows the login form and heading in login mode', () => {
    fixture.componentRef.setInput('mode', 'login');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Welcome back');
    expect(fixture.debugElement.query(By.directive(LoginForm))).toBeTruthy();
  });

  it('on successful register: stores the session and shows the success confirmation', () => {
    authRepository.register.mockReturnValue(of(SESSION));
    fixture.detectChanges();

    registerFormInstance().submitted.emit(VALID_REGISTER_PAYLOAD);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Account created');
  });

  it('on duplicate-email register failure: passes field errors through, does not show success', () => {
    authRepository.register.mockReturnValue(
      throwError(() => new AuthApiError('Validation failed', { email: ['Email is already registered.'] })),
    );
    fixture.detectChanges();

    registerFormInstance().submitted.emit(VALID_REGISTER_PAYLOAD);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Account created');
    expect(fixture.nativeElement.textContent).toContain('Email is already registered.');
  });

  it('on successful login: stores the session and navigates home', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authRepository.login.mockReturnValue(of(SESSION));
    fixture.componentRef.setInput('mode', 'login');
    fixture.detectChanges();

    loginFormInstance().submitted.emit({ email: 'jane@example.com', password: 'Passw0rd!' });

    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('on invalid-credentials login failure: shows the generic error banner', () => {
    authRepository.login.mockReturnValue(throwError(() => new AuthApiError('Invalid email or password.')));
    fixture.componentRef.setInput('mode', 'login');
    fixture.detectChanges();

    loginFormInstance().submitted.emit({ email: 'jane@example.com', password: 'wrong' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invalid email or password.');
  });
});
