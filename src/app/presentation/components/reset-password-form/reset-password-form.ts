import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { passwordsMatchValidator, passwordStrengthValidator } from '../../../shared/utils/auth-validators';
import { fieldErrorMessage } from '../../../shared/utils/form-error-messages';

@Component({
  selector: 'app-reset-password-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon],
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordForm {
  readonly pending = input(false);

  /** Just the new password — the page merges in the token/email read from the query string. */
  readonly submitted = output<{ newPassword: string }>();

  private readonly fb = new FormBuilder().nonNullable;
  protected attemptedSubmit = false;

  protected readonly form = this.fb.group(
    {
      password: this.fb.control('', [Validators.required, passwordStrengthValidator()]),
      confirmPassword: this.fb.control('', [Validators.required]),
    },
    { validators: [passwordsMatchValidator()] },
  );

  protected readonly submitLabel = computed(() =>
    this.pending()
      ? $localize`:@@auth.resetPassword.submit.pending:Guardando…`
      : $localize`:@@auth.resetPassword.submit.idle:Restablecer contraseña`,
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
    this.submitted.emit({ newPassword: value.password });
  }
}
