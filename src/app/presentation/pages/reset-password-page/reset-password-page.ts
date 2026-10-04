import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiError } from '../../../domain/models/auth.model';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { ResetPasswordForm } from '../../components/reset-password-form/reset-password-form';

/**
 * Consumes the token/email from the recovery email's link (`?token=&email=`) to set a new
 * password (HU-15 crit. 3). `RenderMode.Client` in app.routes.server.ts — these query params
 * are read synchronously at construction, a prerendered shell wouldn't have them.
 */
@Component({
  selector: 'app-reset-password-page',
  imports: [RouterLink, ResetPasswordForm],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  private readonly authRepository = inject(AuthRepository);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token');
  protected readonly email = this.route.snapshot.queryParamMap.get('email');

  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly done = signal(false);

  protected readonly missingToken = !this.token;

  protected onSubmit(value: { newPassword: string }): void {
    if (!this.token) {
      return;
    }

    this.pending.set(true);
    this.formError.set(null);

    this.authRepository
      .resetPassword({ token: this.token, email: this.email ?? '', newPassword: value.newPassword })
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.done.set(true);
        },
        error: (error: AuthApiError) => {
          this.pending.set(false);
          this.formError.set(error.message);
        },
      });
  }
}
