import { Observable } from 'rxjs';
import {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
} from '../models/auth.model';

/**
 * Domain-facing contract for authentication. The presentation layer depends on this
 * abstract class (Angular's DI token pattern), never on the concrete HTTP implementation
 * in `data/`.
 */
export abstract class AuthRepository {
  abstract register(payload: RegisterPayload): Observable<AuthSession>;
  abstract login(payload: LoginPayload): Observable<AuthSession>;
  /** Exchanges a still-valid refresh token for a new access/refresh pair (rotation). Used by
   * `authInterceptor` to transparently recover from an expired access token. */
  abstract refresh(refreshToken: string): Observable<AuthSession>;
  /** Starts password recovery for a registered email (HU-15 crit. 1/2). Rejects with a field
   * error under `email` when the account doesn't exist. */
  abstract requestPasswordReset(payload: RequestPasswordResetPayload): Observable<void>;
  /** Consumes a recovery token to set a new password (HU-15 crit. 3). Rejects with a generic
   * (not field-level) error when the token is invalid/expired. */
  abstract resetPassword(payload: ResetPasswordPayload): Observable<void>;
}
