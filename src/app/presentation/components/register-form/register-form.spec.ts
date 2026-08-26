import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { RegisterForm } from './register-form';
import { RegisterPayload } from '../../../domain/models/auth.model';

describe('RegisterForm', () => {
  let fixture: ComponentFixture<RegisterForm>;
  let component: RegisterForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterForm],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterForm);
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
    typeInto('register-firstName', 'Jane');
    typeInto('register-lastName', 'Doe');
    typeInto('register-email', 'jane.doe@example.com');
    typeInto('register-password', 'Passw0rd!');
    typeInto('register-confirmPassword', 'Passw0rd!');
  }

  it('does not emit and shows the error summary when required fields are empty', () => {
    const emitted: RegisterPayload[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    submitButton().click();
    fixture.detectChanges();

    expect(emitted).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.error-summary')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('First name is required.');
  });

  it('emits a trimmed payload when the form is valid', () => {
    let payload: RegisterPayload | undefined;
    component.submitted.subscribe((p) => (payload = p));

    typeInto('register-firstName', '  Jane ');
    typeInto('register-lastName', ' Doe ');
    typeInto('register-email', ' jane.doe@example.com ');
    typeInto('register-password', 'Passw0rd!');
    typeInto('register-confirmPassword', 'Passw0rd!');
    fixture.detectChanges();

    submitButton().click();

    expect(payload).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      password: 'Passw0rd!',
      phone: null,
    });
  });

  it('rejects a password without a digit', () => {
    fillValidForm();
    typeInto('register-password', 'nodigitshere');
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Password must include at least one number.');
  });

  it('rejects a confirm password that does not match', () => {
    fillValidForm();
    typeInto('register-confirmPassword', 'Different1!');
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
  });

  it('accepts a matching confirm password', () => {
    let payload: RegisterPayload | undefined;
    component.submitted.subscribe((p) => (payload = p));
    fillValidForm();
    fixture.detectChanges();

    submitButton().click();

    expect(payload).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Passwords do not match.');
  });

  it('rejects a first name containing digits', () => {
    fillValidForm();
    typeInto('register-firstName', 'Jane123');
    fixture.detectChanges();

    submitButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('First name can only contain letters.');
  });

  it('surfaces a server-side field error (e.g. duplicate email) on the matching control', () => {
    fillValidForm();
    fixture.componentRef.setInput('fieldErrors', { email: ['Email is already registered.'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Email is already registered.');
  });

  it('clears the server-side error once the user edits the field again', () => {
    fillValidForm();
    fixture.componentRef.setInput('fieldErrors', { email: ['Email is already registered.'] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Email is already registered.');

    typeInto('register-email', 'someone-else@example.com');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Email is already registered.');
  });
});
