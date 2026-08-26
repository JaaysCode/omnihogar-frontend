import { HttpErrorResponse } from '@angular/common/http';
import { toAuthApiError, toAuthSession } from './auth.mapper';
import { AuthResponseDto } from '../services/auth-api.dto';

describe('toAuthSession', () => {
  it('maps the DTO 1:1 to the domain session', () => {
    const dto: AuthResponseDto = {
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAtUtc: '2026-08-26T00:00:00Z',
    };

    expect(toAuthSession(dto)).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAtUtc: '2026-08-26T00:00:00Z',
    });
  });
});

describe('toAuthApiError', () => {
  it('maps a 400 with an errors dict to field errors, lowercasing keys', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: {
        status: 400,
        title: 'Validation failed',
        errors: { Email: ['Email is already registered.'] },
      },
    });

    const error = toAuthApiError(httpError);

    expect(error.message).toBe('Validation failed');
    expect(error.fieldErrors).toEqual({ email: ['Email is already registered.'] });
  });

  it('maps a 400 with no errors dict to a message-only error', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: { status: 400, title: 'Something is off' },
    });

    const error = toAuthApiError(httpError);

    expect(error.fieldErrors).toBeUndefined();
    expect(error.message).toBe('Something is off');
  });

  it('maps a 401 to an invalid-credentials message', () => {
    const httpError = new HttpErrorResponse({ status: 401 });

    expect(toAuthApiError(httpError).message).toBe('Invalid email or password.');
  });

  it('maps a network failure (status 0) to a connectivity message', () => {
    const httpError = new HttpErrorResponse({ status: 0 });

    expect(toAuthApiError(httpError).message).toContain('Could not reach the server');
  });

  it('maps a 500 to a generic message', () => {
    const httpError = new HttpErrorResponse({ status: 500 });

    expect(toAuthApiError(httpError).message).toBe('Something went wrong. Please try again.');
  });

  it('maps a non-HttpErrorResponse to a generic message', () => {
    expect(toAuthApiError(new Error('boom')).message).toBe('Something went wrong. Please try again.');
  });
});
