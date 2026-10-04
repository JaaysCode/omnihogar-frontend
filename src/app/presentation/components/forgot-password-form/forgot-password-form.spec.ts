import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';
import { ForgotPasswordForm } from './forgot-password-form';
import { RequestPasswordResetPayload } from '../../../domain/models/auth.model';

describe('ForgotPasswordForm', () => {
  let fixture: ComponentFixture<ForgotPasswordForm>;
  let component: ForgotPasswordForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordForm],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordForm);
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

  it('does not emit when the email is empty', () => {
    const emitted: RequestPasswordResetPayload[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    submitButton().click();
    fixture.detectChanges();

    expect(emitted).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('Este campo es obligatorio.');
  });

  it('emits a trimmed email when valid', () => {
    let payload: RequestPasswordResetPayload | undefined;
    component.submitted.subscribe((p) => (payload = p));

    typeInto('forgot-password-email', ' jane@example.com ');
    fixture.detectChanges();

    submitButton().click();

    expect(payload).toEqual({ email: 'jane@example.com' });
  });

  it('shows a formError banner (e.g. "no existe una cuenta asociada")', () => {
    fixture.componentRef.setInput('formError', 'No existe una cuenta asociada a este correo.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No existe una cuenta asociada a este correo.');
  });
});
