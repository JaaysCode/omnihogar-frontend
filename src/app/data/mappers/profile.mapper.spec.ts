import { HttpErrorResponse } from '@angular/common/http';
import { toProfile, toProfileApiError } from './profile.mapper';
import { ProfileResponseDto } from '../services/profile-api.dto';

describe('toProfile', () => {
  it('maps the DTO 1:1 to the domain profile', () => {
    const dto: ProfileResponseDto = {
      id: 'u1',
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana@x.test',
      phone: '3001234567',
      createdAt: '2026-01-15T00:00:00Z',
    };

    expect(toProfile(dto)).toEqual({
      id: 'u1',
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana@x.test',
      phone: '3001234567',
      createdAt: '2026-01-15T00:00:00Z',
    });
  });
});

describe('toProfileApiError', () => {
  it('maps a 400 with an errors dict to field errors, lowercasing keys', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'Validation failed', errors: { FirstName: ['El nombre es obligatorio.'] } },
    });

    const error = toProfileApiError(httpError);

    expect(error.message).toBe('Validation failed');
    expect(error.fieldErrors).toEqual({ firstName: ['El nombre es obligatorio.'] });
  });

  it('maps a 400 with no errors dict to a message-only error', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'Something is off' },
    });

    const error = toProfileApiError(httpError);

    expect(error.fieldErrors).toBeUndefined();
    expect(error.message).toBe('Something is off');
  });

  it('maps a 401 to a session-expired message', () => {
    const httpError = new HttpErrorResponse({ status: 401 });

    expect(toProfileApiError(httpError).message).toBe('Tu sesión expiró. Inicia sesión de nuevo.');
  });

  it('maps a 404 to an account-not-found message', () => {
    const httpError = new HttpErrorResponse({ status: 404 });

    expect(toProfileApiError(httpError).message).toBe('Tu cuenta ya no existe.');
  });

  it('maps a network failure (status 0) to a connectivity message', () => {
    const httpError = new HttpErrorResponse({ status: 0 });

    expect(toProfileApiError(httpError).message).toContain('No se pudo conectar con el servidor');
  });

  it('maps a 500 to a generic message', () => {
    const httpError = new HttpErrorResponse({ status: 500 });

    expect(toProfileApiError(httpError).message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });

  it('maps a non-HttpErrorResponse to a generic message', () => {
    expect(toProfileApiError(new Error('boom')).message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
