import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { LoginPayload } from '../../../domain/models/auth.model';
import { firstErrorMessage } from '../../../shared/utils/form-error-messages';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  /** Generic error from the backend (e.g. "Invalid credentials.") — not field-specific. */
  readonly formError = input<string | null>(null);
  readonly pending = input(false);

  readonly submitted = output<LoginPayload>();

  private readonly fb = new FormBuilder().nonNullable;
  protected attemptedSubmit = false;

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  // See RegisterForm.submitLabel: same reason this isn't a ternary in the template.
  protected readonly submitLabel = computed(() =>
    this.pending()
      ? $localize`:@@auth.login.submit.pending:Iniciando sesión…`
      : $localize`:@@auth.login.submit.idle:Iniciar sesión`,
  );

  protected errorFor(control: string): string | null {
    const c = this.form.get(control);
    if (!c || !(c.touched || this.attemptedSubmit)) {
      return null;
    }
    const label =
      control === 'email'
        ? $localize`:@@auth.login.field.email.name:Correo electrónico`
        : $localize`:@@auth.login.field.password.name:Contraseña`;
    return firstErrorMessage(label, c.errors);
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({ email: value.email.trim(), password: value.password });
  }
}
