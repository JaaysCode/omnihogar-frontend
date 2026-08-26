import { ValidationErrors } from '@angular/forms';

/**
 * First human-readable message for a control's current errors, in priority order.
 * `fieldLabel` (e.g. "Nombre") is interpolated into the generic messages so screen reader
 * users get a specific, not generic, announcement.
 *
 * Messages are phrased as "El campo «X» ..." rather than "X ..." on purpose: agreement then
 * always lands on the fixed masculine noun "campo", never on `fieldLabel` itself — Spanish
 * field names disagree in gender ("la Contraseña" vs "el Nombre"), and this phrasing sidesteps
 * having to know each label's gender at the call site.
 */
export function firstErrorMessage(
  fieldLabel: string,
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) {
    return null;
  }
  if (errors['server']) {
    return errors['server'] as string;
  }
  if (errors['required']) {
    return $localize`:@@auth.validation.required:El campo «${fieldLabel}:fieldLabel:» es obligatorio.`;
  }
  if (errors['email']) {
    return $localize`:@@auth.validation.email:Ingresa un correo electrónico válido.`;
  }
  if (errors['maxlength']) {
    const max = errors['maxlength'].requiredLength as number;
    return $localize`:@@auth.validation.maxLength:El campo «${fieldLabel}:fieldLabel:» debe tener como máximo ${max}:max: caracteres.`;
  }
  if (errors['namePattern']) {
    return $localize`:@@auth.validation.namePattern:El campo «${fieldLabel}:fieldLabel:» solo puede contener letras.`;
  }
  if (errors['phonePattern']) {
    return $localize`:@@auth.validation.phonePattern:Ingresa un número de teléfono válido.`;
  }
  if (errors['passwordMinLength']) {
    return $localize`:@@auth.validation.passwordMinLength:La contraseña debe tener al menos 8 caracteres.`;
  }
  if (errors['passwordLetter']) {
    return $localize`:@@auth.validation.passwordLetter:La contraseña debe incluir al menos una letra.`;
  }
  if (errors['passwordDigit']) {
    return $localize`:@@auth.validation.passwordDigit:La contraseña debe incluir al menos un número.`;
  }
  if (errors['passwordMismatch']) {
    return $localize`:@@auth.validation.passwordMismatch:Las contraseñas no coinciden.`;
  }
  return $localize`:@@auth.validation.invalid:El campo «${fieldLabel}:fieldLabel:» no es válido.`;
}
