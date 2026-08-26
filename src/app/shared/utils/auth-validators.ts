import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Mirrors the backend's RegisterCommandValidator (OmniHogar.Application/Features/Auth) so the
// user sees the same rules client-side before ever hitting the network.
const NAME_PATTERN = /^[\p{L}\p{M}\s'-]+$/u;
const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/;

export function namePatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return NAME_PATTERN.test(value) ? null : { namePattern: true };
  };
}

export function phonePatternValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return PHONE_PATTERN.test(value) ? null : { phonePattern: true };
  };
}

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    const errors: ValidationErrors = {};
    if (value.length < 8) {
      errors['passwordMinLength'] = true;
    }
    if (!/[A-Za-z]/.test(value)) {
      errors['passwordLetter'] = true;
    }
    if (!/[0-9]/.test(value)) {
      errors['passwordDigit'] = true;
    }
    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Group-level validator: sets/clears `passwordMismatch` on the `confirmPassword` control
 * (not on the group) so the error surfaces on that field like any other field error, via
 * `errorFor('confirmPassword')`. Never touches other errors already on that control (e.g. a
 * pending `required`).
 */
export function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value && confirmPassword.value !== password.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    } else if (confirmPassword.errors?.['passwordMismatch']) {
      const rest = { ...confirmPassword.errors };
      delete rest['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
    return null;
  };
}
