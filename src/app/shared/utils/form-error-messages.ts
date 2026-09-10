import { ValidationErrors } from '@angular/forms';

/**
 * Two readers for the same `ValidationErrors`, in priority order:
 *
 * - {@link fieldErrorMessage} — for the message shown **right under the input**. It does not
 *   name the field: the label sits directly above, so "El campo «Nombre»…" is redundant.
 * - {@link summaryErrorMessage} — for the **error summary** at the top of the form, where each
 *   line is a focus link and *must* say which field it points at.
 *
 * The summary phrasing is "El campo «X» …" on purpose: agreement lands on the fixed masculine
 * noun "campo", never on the field label (Spanish labels disagree in gender — "la Contraseña"
 * vs "el Nombre"), so the call site never needs to know each label's gender.
 */

/** Inline message shown under the field — no field name. */
export function fieldErrorMessage(errors: ValidationErrors | null | undefined): string | null {
  if (!errors) {
    return null;
  }
  if (errors['server']) {
    return errors['server'] as string;
  }
  if (errors['required']) {
    return $localize`:@@validation.inline.required:Este campo es obligatorio.`;
  }
  if (errors['email']) {
    return $localize`:@@auth.validation.email:Ingresa un correo electrónico válido.`;
  }
  if (errors['maxlength']) {
    const max = errors['maxlength'].requiredLength as number;
    return $localize`:@@validation.inline.maxLength:Debe tener como máximo ${max}:max: caracteres.`;
  }
  if (errors['min']) {
    const min = errors['min'].min as number;
    return $localize`:@@validation.inline.min:Debe ser mayor o igual a ${min}:min:.`;
  }
  if (errors['namePattern']) {
    return $localize`:@@validation.inline.namePattern:Solo se permiten letras.`;
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
  return $localize`:@@validation.inline.invalid:El valor no es válido.`;
}

/** Summary-list message — keeps the field name, since the summary line is a focus link. */
export function summaryErrorMessage(
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
  if (errors['min']) {
    const min = errors['min'].min as number;
    return $localize`:@@auth.validation.min:El campo «${fieldLabel}:fieldLabel:» debe ser mayor o igual a ${min}:min:.`;
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
