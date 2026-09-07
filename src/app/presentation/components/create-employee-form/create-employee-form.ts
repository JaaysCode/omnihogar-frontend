import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import { CreateEmployeePayload, FieldErrors, Role } from '../../../domain/models/employee.model';
import { namePatternValidator, passwordStrengthValidator, phonePatternValidator } from '../../../shared/utils/auth-validators';
import { firstErrorMessage } from '../../../shared/utils/form-error-messages';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

// Bare field names (no required-marker, no markup) — fed into `firstErrorMessage` for the
// error-summary and per-field error text. Kept as a separate translation unit from the on-screen
// `<label>` in the template (`employees.create.field.*.label`), since that one also carries the
// "*" required marker and would otherwise be a same-id/different-content clash.
const FIELDS: readonly FieldSpec[] = [
  { control: 'firstName', label: $localize`:@@employees.create.field.firstName.name:Nombre` },
  { control: 'lastName', label: $localize`:@@employees.create.field.lastName.name:Apellido` },
  { control: 'email', label: $localize`:@@employees.create.field.email.name:Correo electrónico` },
  { control: 'phone', label: $localize`:@@employees.create.field.phone.name:Teléfono` },
  { control: 'password', label: $localize`:@@employees.create.field.password.name:Contraseña` },
  { control: 'roleId', label: $localize`:@@employees.create.field.roleId.name:Rol` },
];

@Component({
  selector: 'app-create-employee-form',
  imports: [ReactiveFormsModule, TuiButton, TuiIcon, TuiDropdown, TuiDataList, TuiChevron],
  templateUrl: './create-employee-form.html',
  styleUrl: './create-employee-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEmployeeForm {
  readonly roles = input<Role[]>([]);
  /** Server-side field errors from a failed submit (e.g. duplicate email), keyed camelCase. */
  readonly fieldErrors = input<FieldErrors | null>(null);
  readonly pending = input(false);

  readonly submitted = output<CreateEmployeePayload>();

  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly fb = new FormBuilder().nonNullable;

  protected attemptedSubmit = false;

  protected readonly submitLabel = computed(() =>
    this.pending()
      ? $localize`:@@employees.create.submit.pending:Creando cuenta…`
      : $localize`:@@employees.create.submit.idle:Crear empleado`,
  );

  protected readonly rolePlaceholder = $localize`:@@employees.create.field.roleId.placeholder:Selecciona un rol`;

  protected readonly roleMenuOpen = signal(false);

  protected readonly form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(100), namePatternValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(100), namePatternValidator()]),
    email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(150)]),
    phone: this.fb.control('', [phonePatternValidator()]),
    password: this.fb.control('', [Validators.required, passwordStrengthValidator()]),
    // Holds the selected `Role` object (not just its id) — set from the dropdown's `onSelectRole`
    // below. Unwrapped to `.id` in `onSubmit`.
    roleId: this.fb.control<Role | null>(null, [Validators.required]),
  });

  // Read reactively for the trigger button's label — `toSignal` keeps this in sync with
  // `roleId`'s value regardless of whether it changed via `onSelectRole` or (elsewhere) `patchValue`.
  protected readonly selectedRole = toSignal(this.form.controls.roleId.valueChanges, {
    initialValue: this.form.controls.roleId.value,
  });

  protected readonly roleButtonLabel = computed(() => this.selectedRole()?.name ?? this.rolePlaceholder);

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
      message:
        firstErrorMessage(label, this.form.get(control)?.errors) ??
        $localize`:@@employees.create.field.genericInvalid:El campo «${label}:label:» no es válido.`,
    }));
  }

  protected focusField(control: string): void {
    const element = document.getElementById(`create-employee-${control}`);
    element?.focus();
  }

  protected onSelectRole(role: Role): void {
    this.form.controls.roleId.setValue(role);
    this.form.controls.roleId.markAsTouched();
    this.roleMenuOpen.set(false);
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    if (!value.roleId) {
      return;
    }
    const payload: CreateEmployeePayload = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim(),
      password: value.password,
      phone: value.phone.trim() || null,
      roleId: value.roleId.id,
    };
    this.submitted.emit(payload);
  }
}
