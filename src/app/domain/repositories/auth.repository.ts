import { Observable } from 'rxjs';
import { AuthSession, LoginPayload, RegisterPayload } from '../models/auth.model';

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
}
