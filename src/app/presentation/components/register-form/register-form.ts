import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { FieldErrors, RegisterPayload } from '../../../domain/models/auth.model';
import {
  namePatternValidator,
  passwordsMatchValidator,
  passwordStrengthValidator,
  phonePatternValidator,
} from '../../../shared/utils/auth-validators';
import { fieldErrorMessage, summaryErrorMessage } from '../../../shared/utils/form-error-messages';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

// Bare field names (no required-marker, no markup) — fed into `summaryErrorMessage` for the
// error-summary and per-field error text. Kept as a separate translation unit from the
// on-screen `<label>` in the template (`auth.register.field.*.label`), since that one also
// carries the "*" required marker and would otherwise be a same-id/different-content clash.
const FIELDS: readonly FieldSpec[] = [
  { control: 'firstName', label: $localize`:@@auth.register.field.firstName.name:Nombre` },
  { control: 'lastName', label: $localize`:@@auth.register.field.lastName.name:Apellido` },
  { control: 'email', label: $localize`:@@auth.register.field.email.name:Correo electrónico` },
  { control: 'phone', label: $localize`:@@auth.register.field.phone.name:Teléfono` },
  { control: 'password', label: $localize`:@@auth.register.field.password.name:Contraseña` },
  {
    control: 'confirmPassword',
    label: $localize`:@@auth.register.field.confirmPassword.name:Confirmar contraseña`,
  },
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

  // A ternary directly in the template can't carry an `i18n` attribute (there's no single
  // wrapping element for "the text node changes"), so the two submit-button strings are
  // built here instead — each its own translation unit — and read into the template as a
  // computed signal.
  protected readonly submitLabel = computed(() =>
    this.pending()
      ? $localize`:@@auth.register.submit.pending:Creando cuenta…`
      : $localize`:@@auth.register.submit.idle:Crear cuenta`,
  );

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
    return fieldErrorMessage(c.errors);
  }

  protected get invalidFieldSummary(): { control: string; label: string; message: string }[] {
    return FIELDS.filter(({ control }) => this.form.get(control)?.invalid).map(({ control, label }) => ({
      control,
      label,
      message: summaryErrorMessage(label, this.form.get(control)?.errors) ??
        $localize`:@@auth.summary.genericInvalid:El campo «${label}:label:» no es válido.`,
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
