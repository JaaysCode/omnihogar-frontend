import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthSession, LoginPayload, RegisterPayload } from '../../domain/models/auth.model';
import { toAuthApiError, toAuthSession } from '../mappers/auth.mapper';
import { AuthApiService } from '../services/auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthRepositoryImpl implements AuthRepository {
  private readonly api = inject(AuthApiService);

  register(payload: RegisterPayload): Observable<AuthSession> {
    return this.api.register(payload).pipe(
      map(toAuthSession),
      catchError((error) => throwError(() => toAuthApiError(error))),
    );
  }

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.api.login(payload).pipe(
      map(toAuthSession),
      catchError((error) => throwError(() => toAuthApiError(error))),
    );
  }

  refresh(refreshToken: string): Observable<AuthSession> {
    return this.api.refresh(refreshToken).pipe(
      map(toAuthSession),
      catchError((error) => throwError(() => toAuthApiError(error))),
    );
  }
}
