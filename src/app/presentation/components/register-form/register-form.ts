import { ChangeDetectionStrategy, Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { FieldErrors, RegisterPayload } from '../../../domain/models/auth.model';
import {
  namePatternValidator,
  passwordsMatchValidator,
  passwordStrengthValidator,
  phonePatternValidator,
} from '../../../shared/utils/auth-validators';
import { firstErrorMessage } from '../../../shared/utils/form-error-messages';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

const FIELDS: readonly FieldSpec[] = [
  { control: 'firstName', label: 'First name' },
  { control: 'lastName', label: 'Last name' },
  { control: 'email', label: 'Email' },
  { control: 'phone', label: 'Phone' },
  { control: 'password', label: 'Password' },
  { control: 'confirmPassword', label: 'Confirm password' },
];

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
  /** Server-side field errors from a failed submit (e.g. duplicate email), keyed camelCase. */
  readonly fieldErrors = input<FieldErrors | null>(null);
  readonly pending = input(false);

  readonly submitted = output<RegisterPayload>();

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly fb = new FormBuilder().nonNullable;

  protected attemptedSubmit = false;

  protected readonly form = this.fb.group(
    {
      firstName: this.fb.control('', [Validators.required, Validators.maxLength(100), namePatternValidator()]),
      lastName: this.fb.control('', [Validators.required, Validators.maxLength(100), namePatternValidator()]),
      email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(150)]),
      phone: this.fb.control('', [phonePatternValidator()]),
      password: this.fb.control('', [Validators.required, passwordStrengthValidator()]),
      confirmPassword: this.fb.control('', [Validators.required]),
    },
    { validators: [passwordsMatchValidator()] },
  );

  constructor() {
    // Merge server-side errors (e.g. "email already registered") into the matching control,
    // and clear them the moment the user edits the field again.
    effect(() => {
      const errors = this.fieldErrors();
      if (!errors) {
        return;
      }
      for (const [field, messages] of Object.entries(errors)) {
        const control = this.form.get(field);
        if (control && messages.length > 0) {
          control.setErrors({ ...control.errors, server: messages[0] });
          control.markAsTouched();
        }
      }
    });

    for (const { control } of FIELDS) {
      this.form.get(control)?.valueChanges.subscribe(() => {
        const c = this.form.get(control);
        if (c?.errors?.['server']) {
          const rest = { ...c.errors };
          delete rest['server'];
          c.setErrors(Object.keys(rest).length > 0 ? rest : null);
        }
      });
    }
  }

  protected fieldLabel(control: string): string {
    return FIELDS.find((f) => f.control === control)?.label ?? control;
  }

  protected errorFor(control: string): string | null {
    const c = this.form.get(control);
    if (!c || !(c.touched || this.attemptedSubmit)) {
      return null;
    }
    return firstErrorMessage(this.fieldLabel(control), c.errors);
  }

  protected get invalidFieldSummary(): { control: string; label: string; message: string }[] {
    return FIELDS.filter(({ control }) => this.form.get(control)?.invalid).map(({ control, label }) => ({
      control,
      label,
      message: firstErrorMessage(label, this.form.get(control)?.errors) ?? `${label} is invalid.`,
    }));
  }

  protected focusField(control: string): void {
    const element = document.getElementById(`register-${control}`);
    element?.focus();
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    const payload: RegisterPayload = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      password: value.password,
      phone: value.phone.trim() || null,
    };
    this.submitted.emit(payload);
  }
}
