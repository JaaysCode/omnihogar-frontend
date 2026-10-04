import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ResetPasswordPage } from './reset-password-page';
import { ResetPasswordForm } from '../../components/reset-password-form/reset-password-form';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { AuthApiError } from '../../../domain/models/auth.model';

describe('ResetPasswordPage', () => {
  let fixture: ComponentFixture<ResetPasswordPage>;
  let authRepository: { resetPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authRepository = { resetPassword: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [provideRouter([]), provideTaiga(), { provide: AuthRepository, useValue: authRepository }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPage);
  });

  function formInstance(): ResetPasswordForm {
    return fixture.debugElement.query(By.directive(ResetPasswordForm)).componentInstance;
  }

  it('without a token in the query string: shows the invalid-link message, no form', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Enlace inválido');
    expect(fixture.debugElement.query(By.directive(ResetPasswordForm))).toBeNull();
  });

  it('on success: calls resetPassword with the token/email from the query string, shows confirmation', () => {
    authRepository.resetPassword.mockReturnValue(of(undefined));
    fixture.componentRef.setInput('token', 'raw-token');
    fixture.componentRef.setInput('email', 'jane@example.com');
    fixture.detectChanges();

    formInstance().submitted.emit({ newPassword: 'NewPassw0rd!' });
    fixture.detectChanges();

    expect(authRepository.resetPassword).toHaveBeenCalledWith({
      token: 'raw-token',
      email: 'jane@example.com',
      newPassword: 'NewPassw0rd!',
    });
    expect(fixture.nativeElement.textContent).toContain('Contraseña actualizada');
  });

  it('on "invalid/expired token" failure: shows the error message', () => {
    authRepository.resetPassword.mockReturnValue(
      throwError(() => new AuthApiError('El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.')),
    );
    fixture.componentRef.setInput('token', 'raw-token');
    fixture.detectChanges();

    formInstance().submitted.emit({ newPassword: 'NewPassw0rd!' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El enlace de recuperación no es válido o ya expiró.');
  });
});
