import { FormControl } from '@angular/forms';
import { namePatternValidator, passwordStrengthValidator, phonePatternValidator } from './auth-validators';

describe('namePatternValidator', () => {
  const validator = namePatternValidator();

  it('accepts letters, spaces, hyphens and apostrophes', () => {
    expect(validator(new FormControl("Anne-Marie O'Neil"))).toBeNull();
  });

  it('accepts accented letters', () => {
    expect(validator(new FormControl('José María'))).toBeNull();
  });

  it('rejects digits', () => {
    expect(validator(new FormControl('Jane123'))).toEqual({ namePattern: true });
  });

  it('treats empty value as valid (required handles emptiness)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });
});

describe('phonePatternValidator', () => {
  const validator = phonePatternValidator();

  it('accepts a plausible international number', () => {
    expect(validator(new FormControl('+57 300 1234567'))).toBeNull();
  });

  it('rejects letters', () => {
    expect(validator(new FormControl('not-a-phone'))).toEqual({ phonePattern: true });
  });

  it('treats empty value as valid (field is optional)', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });
});

describe('passwordStrengthValidator', () => {
  const validator = passwordStrengthValidator();

  it('accepts a password with a letter, a digit, and 8+ characters', () => {
    expect(validator(new FormControl('Passw0rd'))).toBeNull();
  });

  it('flags a too-short password', () => {
    expect(validator(new FormControl('Ab1'))?.['passwordMinLength']).toBe(true);
  });

  it('flags a password with no digit', () => {
    expect(validator(new FormControl('nodigitshere'))?.['passwordDigit']).toBe(true);
  });

  it('flags a password with no letter', () => {
    expect(validator(new FormControl('12345678'))?.['passwordLetter']).toBe(true);
  });
});
