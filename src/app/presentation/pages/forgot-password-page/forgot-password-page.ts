import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthApiError, RequestPasswordResetPayload } from '../../../domain/models/auth.model';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { ForgotPasswordForm } from '../../components/forgot-password-form/forgot-password-form';

/**
 * "¿Olvidaste tu contraseña?" (HU-15 crit. 1/2) — requests a recovery email for a registered
 * address. Reached from login-form's link, not toggled with login/register like AuthPage.
 */
@Component({
  selector: 'app-forgot-password-page',
  imports: [RouterLink, ForgotPasswordForm],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly authRepository = inject(AuthRepository);

  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly sent = signal(false);

  protected onSubmit(payload: RequestPasswordResetPayload): void {
    this.pending.set(true);
    this.formError.set(null);

    this.authRepository.requestPasswordReset(payload).subscribe({
      next: () => {
        this.pending.set(false);
        this.sent.set(true);
      },
      error: (error: AuthApiError) => {
        this.pending.set(false);
        const firstFieldError = error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] : undefined;
        this.formError.set(firstFieldError ?? error.message);
      },
    });
  }
}
