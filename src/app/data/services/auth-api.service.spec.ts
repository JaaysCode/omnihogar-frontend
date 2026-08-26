import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api.config';
import { AuthApiService } from './auth-api.service';
import { AuthResponseDto } from './auth-api.dto';

const BASE_URL = 'http://test-api/api';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
      ],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs to /auth/register with the payload and returns the response', () => {
    const dto: AuthResponseDto = {
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAtUtc: '2026-08-26T00:00:00Z',
    };
    let result: AuthResponseDto | undefined;

    service
      .register({ email: 'jane@example.com', password: 'Passw0rd!', firstName: 'Jane', lastName: 'Doe' })
      .subscribe((response) => (result = response));

    const req = httpMock.expectOne(`${BASE_URL}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'jane@example.com',
      password: 'Passw0rd!',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: null,
    });
    req.flush(dto);

    expect(result).toEqual(dto);
  });

  it('POSTs to /auth/login with the payload', () => {
    service.login({ email: 'jane@example.com', password: 'Passw0rd!' }).subscribe();

    const req = httpMock.expectOne(`${BASE_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jane@example.com', password: 'Passw0rd!' });
    req.flush({ accessToken: 'a', refreshToken: 'r', expiresAtUtc: '2026-01-01T00:00:00Z' });
  });
});
