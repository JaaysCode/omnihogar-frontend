import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import {
  LoginPayload,
  RegisterPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
} from '../../domain/models/auth.model';
import {
  AuthResponseDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
} from './auth-api.dto';

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

  refresh(refreshToken: string): Observable<AuthResponseDto> {
    const body: RefreshRequestDto = { refreshToken };
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/auth/refresh`, body);
  }

  requestPasswordReset(payload: RequestPasswordResetPayload): Observable<void> {
    const body: ForgotPasswordRequestDto = { email: payload.email };
    return this.http.post<void>(`${this.baseUrl}/auth/forgot-password`, body);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<void> {
    const body: ResetPasswordRequestDto = { token: payload.token, newPassword: payload.newPassword };
    return this.http.post<void>(`${this.baseUrl}/auth/reset-password`, body);
  }
}
