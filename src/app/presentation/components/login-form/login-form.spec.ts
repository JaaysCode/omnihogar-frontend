import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { LoginForm } from './login-form';
import { LoginPayload } from '../../../domain/models/auth.model';

describe('LoginForm', () => {
  let fixture: ComponentFixture<LoginForm>;
  let component: LoginForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginForm],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginForm);
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

  it('does not emit when required fields are empty', () => {
    const emitted: LoginPayload[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    submitButton().click();
    fixture.detectChanges();

    expect(emitted).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('Email is required.');
  });

  it('emits a trimmed payload when valid', () => {
    let payload: LoginPayload | undefined;
    component.submitted.subscribe((p) => (payload = p));

    typeInto('login-email', ' jane@example.com ');
    typeInto('login-password', 'Passw0rd!');
    fixture.detectChanges();

    submitButton().click();

    expect(payload).toEqual({ email: 'jane@example.com', password: 'Passw0rd!' });
  });

  it('shows a generic banner for a formError input (e.g. invalid credentials)', () => {
    fixture.componentRef.setInput('formError', 'Invalid email or password.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invalid email or password.');
  });
});
