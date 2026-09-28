import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProfilePage } from './profile-page';
import { ProfileRepository } from '../../../domain/repositories/profile.repository';
import { Profile, ProfileApiError } from '../../../domain/models/profile.model';
import { CartStore } from '../../../core/services/cart-store.service';

const PROFILE: Profile = {
  id: 'u1',
  firstName: 'Ana',
  lastName: 'Gómez',
  email: 'ana@x.test',
  phone: '3001234567',
  createdAt: '2026-01-15T00:00:00Z',
};

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  let repository: { getMyProfile: ReturnType<typeof vi.fn>; updateMyProfile: ReturnType<typeof vi.fn> };
  let alerts: { open: ReturnType<typeof vi.fn> };

  function build(getMyProfileResult = of(PROFILE)) {
    repository = {
      getMyProfile: vi.fn().mockReturnValue(getMyProfileResult),
      updateMyProfile: vi.fn().mockReturnValue(of(PROFILE)),
    };
    alerts = { open: vi.fn().mockReturnValue(EMPTY) };
    // ProfilePage renders <app-public-header>, which injects CartStore — stub it out, its
    // behavior isn't under test here.
    const cartStore = { itemCount: signal(0) };

    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        provideTaiga(),
        { provide: TuiAlertService, useValue: alerts },
        { provide: ProfileRepository, useValue: repository },
        { provide: CartStore, useValue: cartStore },
      ],
    });

    fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
  }

  it('loads the profile on init and prefills the form', () => {
    build();
    expect(repository.getMyProfile).toHaveBeenCalled();
    const firstNameInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-firstName');
    expect(firstNameInput.value).toBe('Ana');
  });

  it('shows the current data, including the editable email', () => {
    build();
    const lastNameInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-lastName');
    expect(lastNameInput.value).toBe('Gómez');
    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-email');
    expect(emailInput.value).toBe('ana@x.test');
    expect(emailInput.disabled).toBe(false);
  });

  it('shows a load error instead of the form when the fetch fails', () => {
    build(throwError(() => new ProfileApiError('boom')));
    expect(fixture.nativeElement.textContent).toContain('boom');
  });

  it('blocks submit and reports invalid fields when a required field is cleared', () => {
    build();
    const firstNameInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-firstName');
    firstNameInput.value = '';
    firstNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(repository.updateMyProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Corrige lo siguiente');
  });

  it('submits valid changes through the repository and shows a success alert', () => {
    build();
    const firstNameInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-firstName');
    firstNameInput.value = 'Ana María';
    firstNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(repository.updateMyProfile).toHaveBeenCalledWith({
      firstName: 'Ana María',
      lastName: 'Gómez',
      email: 'ana@x.test',
      phone: '3001234567',
    });
    expect(alerts.open).toHaveBeenCalled();
  });

  it('submits a changed email through the repository', () => {
    build();
    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-email');
    emailInput.value = 'ana.maria@x.test';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(repository.updateMyProfile).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana.maria@x.test',
      phone: '3001234567',
    });
  });

  it('blocks submit when the email format is invalid', () => {
    build();
    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#profile-form-email');
    emailInput.value = 'not-an-email';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(repository.updateMyProfile).not.toHaveBeenCalled();
  });

  it('surfaces server-side field errors on the matching control without discarding the form', () => {
    build();
    repository.updateMyProfile.mockReturnValue(
      throwError(() => new ProfileApiError('Hay campos que corregir.', { firstName: ['El nombre es obligatorio.'] })),
    );

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio.');
  });
});
