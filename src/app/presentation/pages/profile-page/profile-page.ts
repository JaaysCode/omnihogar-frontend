import { ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { PublicHeader } from '../../components/public-header/public-header';
import { FieldErrors, Profile, ProfileApiError } from '../../../domain/models/profile.model';
import { ProfileRepository } from '../../../domain/repositories/profile.repository';
import { namePatternValidator, phonePatternValidator } from '../../../shared/utils/auth-validators';
import { fieldErrorMessage, summaryErrorMessage } from '../../../shared/utils/form-error-messages';

interface FieldSpec {
  readonly control: string;
  readonly label: string;
}

const FIELDS: readonly FieldSpec[] = [
  { control: 'firstName', label: $localize`:@@profile.form.field.firstName.name:Nombre` },
  { control: 'lastName', label: $localize`:@@profile.form.field.lastName.name:Apellido` },
  { control: 'email', label: $localize`:@@profile.form.field.email.name:Correo electrónico` },
  { control: 'phone', label: $localize`:@@profile.form.field.phone.name:Teléfono` },
];

/**
 * "Mi perfil" (HU-16) — reachable by every authenticated role (cliente, administrador, jefe de
 * bodega, coordinador de despacho, asesor de tienda). Loads the current user's own data on init
 * (crit. 1) and lets them edit name/email/phone (crit. 2); server + client-side field errors
 * block an invalid save without discarding what's already valid (crit. 3). Email change here is
 * unverified (no confirmation link) — it takes effect immediately, same as any other field.
 */
@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, RouterLink, PublicHeader, TuiButton, TuiIcon, DatePipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly profileRepository = inject(ProfileRepository);
  private readonly alerts = inject(TuiAlertService);
  private readonly fb = new FormBuilder().nonNullable;

  protected readonly profile = signal<Profile | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected attemptedSubmit = false;

  /** Iniciales para el avatar de la columna de resumen. */
  protected readonly initials = computed(() => {
    const p = this.profile();
    if (!p) {
      return '';
    }
    return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  });
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  protected readonly form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.maxLength(100), namePatternValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.maxLength(100), namePatternValidator()]),
    email: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(150)]),
    phone: this.fb.control('', [phonePatternValidator()]),
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  /** True cuando hay algo distinto a lo último guardado: habilita "Guardar" y avisa al usuario. */
  protected readonly hasChanges = computed(() => {
    const saved = this.profile();
    const current = this.formValue();
    if (!saved) {
      return false;
    }
    return (
      current.firstName.trim() !== saved.firstName ||
      current.lastName.trim() !== saved.lastName ||
      current.email.trim() !== saved.email ||
      current.phone.trim() !== (saved.phone ?? '')
    );
  });

  constructor() {
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

  ngOnInit(): void {
    this.profileRepository.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone ?? '',
        });
      },
      error: (error: ProfileApiError) => this.loadError.set(error.message),
    });
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
      message:
        summaryErrorMessage(label, this.form.get(control)?.errors) ??
        $localize`:@@profile.form.error.summaryFallback:${label}:label: no es válido.`,
    }));
  }

  protected focusField(control: string): void {
    document.getElementById(`profile-form-${control}`)?.focus();
  }

  protected onSubmit(): void {
    this.attemptedSubmit = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const value = this.form.getRawValue();
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.profileRepository
      .updateMyProfile({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim() || null,
      })
      .subscribe({
        next: (profile) => {
          this.pending.set(false);
          this.profile.set(profile);
          this.alerts
            .open($localize`:@@profile.form.saveSuccess:Tus datos se actualizaron correctamente.`, {
              appearance: 'positive',
            })
            .subscribe();
        },
        error: (error: ProfileApiError) => {
          this.pending.set(false);
          this.fieldErrors.set(error.fieldErrors ?? null);
          this.formError.set(error.fieldErrors ? null : error.message);
          if (error.fieldErrors) {
            for (const [field, messages] of Object.entries(error.fieldErrors)) {
              const control = this.form.get(field);
              if (control && messages.length > 0) {
                control.setErrors({ ...control.errors, server: messages[0] });
                control.markAsTouched();
              }
            }
          }
        },
      });
  }
}
