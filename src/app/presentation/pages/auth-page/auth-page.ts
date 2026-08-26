import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AuthApiError, FieldErrors, LoginPayload, RegisterPayload } from '../../../domain/models/auth.model';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { LoginForm } from '../../components/login-form/login-form';
import { RegisterForm } from '../../components/register-form/register-form';

export type AuthMode = 'login' | 'register';

/**
 * Split-screen auth page: branding/message half + form half, toggling between the
 * register and login flows via route (`/register`, `/login`). Employees/admins are
 * provisioned separately — this is customer self-registration only.
 */
@Component({
  selector: 'app-auth-page',
  imports: [RouterLink, TuiButton, RegisterForm, LoginForm],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  /** Bound from route `data.mode` via withComponentInputBinding(). */
  readonly mode = input<AuthMode>('register');

  private readonly authRepository = inject(AuthRepository);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly registered = signal(false);

  protected readonly isRegister = computed(() => this.mode() === 'register');

  protected onRegister(payload: RegisterPayload): void {
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.authRepository.register(payload).subscribe({
      next: (authSession) => {
        this.session.setSession(authSession);
        this.pending.set(false);
        this.registered.set(true);
      },
      error: (error: AuthApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }

  protected onLogin(payload: LoginPayload): void {
    this.pending.set(true);
    this.formError.set(null);

    this.authRepository.login(payload).subscribe({
      next: (authSession) => {
        this.session.setSession(authSession);
        this.pending.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (error: AuthApiError) => {
        this.pending.set(false);
        this.formError.set(error.message);
      },
    });
  }

  protected continueAfterRegister(): void {
    void this.router.navigateByUrl('/');
  }
}
