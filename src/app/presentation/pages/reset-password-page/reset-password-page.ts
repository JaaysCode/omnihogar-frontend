import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthApiError } from '../../../domain/models/auth.model';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { ResetPasswordForm } from '../../components/reset-password-form/reset-password-form';

/**
 * Consumes the token/email from the recovery email's link (`?token=&email=`) to set a new
 * password (HU-15 crit. 3). Bound from the query string via withComponentInputBinding (see
 * app.config.ts) — same pattern as orders-page's `?order` / my-orders-page. `RenderMode.Client`
 * in app.routes.server.ts: a prerendered shell wouldn't have these params.
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

  readonly token = input<string | undefined>(undefined);
  readonly email = input<string | undefined>(undefined);

  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly done = signal(false);

  protected readonly missingToken = computed(() => !this.token());

  protected onSubmit(value: { newPassword: string }): void {
    const token = this.token();
    if (!token) {
      return;
    }

    this.pending.set(true);
    this.formError.set(null);

    this.authRepository
      .resetPassword({ token, email: this.email() ?? '', newPassword: value.newPassword })
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
