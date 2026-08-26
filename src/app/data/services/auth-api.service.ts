import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { LoginPayload, RegisterPayload } from '../../domain/models/auth.model';
import { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from './auth-api.dto';

/**
 * Raw HTTP client for the `/auth` endpoints. Transport-only: no error translation,
 * no domain mapping — see `AuthRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  register(payload: RegisterPayload): Observable<AuthResponseDto> {
    const body: RegisterRequestDto = {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone ?? null,
    };
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/auth/register`, body);
  }

  login(payload: LoginPayload): Observable<AuthResponseDto> {
    const body: LoginRequestDto = { email: payload.email, password: payload.password };
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/auth/login`, body);
  }
}
