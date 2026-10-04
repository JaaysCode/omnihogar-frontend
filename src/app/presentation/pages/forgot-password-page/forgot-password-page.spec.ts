import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ForgotPasswordPage } from './forgot-password-page';
import { ForgotPasswordForm } from '../../components/forgot-password-form/forgot-password-form';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { AuthApiError } from '../../../domain/models/auth.model';

describe('ForgotPasswordPage', () => {
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let authRepository: { requestPasswordReset: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authRepository = { requestPasswordReset: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [provideRouter([]), provideTaiga(), { provide: AuthRepository, useValue: authRepository }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
  });

  function formInstance(): ForgotPasswordForm {
    return fixture.debugElement.query(By.directive(ForgotPasswordForm)).componentInstance;
  }

  it('on success: shows the "revisa tu correo" confirmation', () => {
    authRepository.requestPasswordReset.mockReturnValue(of(undefined));
    fixture.detectChanges();

    formInstance().submitted.emit({ email: 'jane@example.com' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Revisa tu correo');
  });

  it('on "email not registered" failure: shows the field error, no confirmation', () => {
    authRepository.requestPasswordReset.mockReturnValue(
      throwError(() => new AuthApiError('Validation failed', { email: ['No existe una cuenta asociada a este correo.'] })),
    );
    fixture.detectChanges();

    formInstance().submitted.emit({ email: 'nobody@example.com' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Revisa tu correo');
    expect(fixture.nativeElement.textContent).toContain('No existe una cuenta asociada a este correo.');
  });
});
