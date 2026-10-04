import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { RequestPasswordResetPayload } from '../../../domain/models/auth.model';
import { fieldErrorMessage } from '../../../shared/utils/form-error-messages';

@Component({
  selector: 'app-forgot-password-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon],
  templateUrl: './forgot-password-form.html',
  styleUrl: './forgot-password-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordForm {
  /** Generic/field error from the backend (e.g. "no existe una cuenta asociada"). */
  readonly formError = input<string | null>(null);
  readonly pending = input(false);

  readonly submitted = output<RequestPasswordResetPayload>();

  private readonly fb = new FormBuilder().nonNullable;
  protected attemptedSubmit = false;

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
  });

  protected readonly submitLabel = computed(() =>
    this.pending()
      ? $localize`:@@auth.forgotPassword.submit.pending:Enviando…`
      : $localize`:@@auth.forgotPassword.submit.idle:Enviar enlace de recuperación`,
  );

  protected errorFor(control: string): string | null {
    const c = this.form.get(control);
    if (!c || !(c.touched || this.attemptedSubmit)) {
      return null;
    }
    return fieldErrorMessage(c.errors);
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({ email: value.email.trim() });
  }
}
