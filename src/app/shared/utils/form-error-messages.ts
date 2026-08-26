import { ValidationErrors } from '@angular/forms';

/**
 * First human-readable message for a control's current errors, in priority order.
 * `fieldLabel` (e.g. "First name") is interpolated into the generic messages so
 * screen reader users get a specific, not generic, announcement.
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
    return `${fieldLabel} is required.`;
  }
  if (errors['email']) {
    return `Enter a valid email address.`;
  }
  if (errors['maxlength']) {
    const max = errors['maxlength'].requiredLength as number;
    return `${fieldLabel} must be at most ${max} characters.`;
  }
  if (errors['namePattern']) {
    return `${fieldLabel} can only contain letters.`;
  }
  if (errors['phonePattern']) {
    return `Enter a valid phone number.`;
  }
  if (errors['passwordMinLength']) {
    return `Password must be at least 8 characters long.`;
  }
  if (errors['passwordLetter']) {
    return `Password must include at least one letter.`;
  }
  if (errors['passwordDigit']) {
    return `Password must include at least one number.`;
  }
  if (errors['passwordMismatch']) {
    return `Passwords do not match.`;
  }
  return `${fieldLabel} is invalid.`;
}
