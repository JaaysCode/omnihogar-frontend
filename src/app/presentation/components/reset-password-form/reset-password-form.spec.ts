import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { ResetPasswordForm } from './reset-password-form';

describe('ResetPasswordForm', () => {
  let fixture: ComponentFixture<ResetPasswordForm>;
  let component: ResetPasswordForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordForm],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]');
  }

  function typeInto(id: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(`#${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function fillValidForm(): void {
    typeInto('reset-password-password', 'NewPassw0rd!');
    typeInto('reset-password-confirmPassword', 'NewPassw0rd!');
  }

  it('does not emit when required fields are empty', () => {
    const emitted: { newPassword: string }[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    submitButton().click();
    fixture.detectChanges();

    expect(emitted).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('Este campo es obligatorio.');
  });

  it('emits the new password when the form is valid', () => {
    let payload: { newPassword: string } | undefined;
    component.submitted.subscribe((p) => (payload = p));
    fillValidForm();
    fixture.detectChanges();

    submitButton().click();

    expect(payload).toEqual({ newPassword: 'NewPassw0rd!' });
  });

  it('rejects a password without a digit', () => {
    fillValidForm();
    typeInto('reset-password-password', 'nodigitshere');
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La contraseña debe incluir al menos un número.');
  });

  it('rejects a confirm password that does not match', () => {
    fillValidForm();
    typeInto('reset-password-confirmPassword', 'Different1!');
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Las contraseñas no coinciden.');
  });
});
