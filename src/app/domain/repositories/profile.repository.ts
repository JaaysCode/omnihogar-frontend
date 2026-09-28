import { Observable } from 'rxjs';
import { Profile, UpdateProfilePayload } from '../models/profile.model';

/**
 * Domain-facing contract for the current user's own account data (HU-16). The presentation
 * layer depends on this abstract class (Angular's DI token pattern), never on the concrete
 * HTTP implementation in `data/`.
 */
export abstract class ProfileRepository {
  /** Own profile (HU-16 crit. 1: "Mostrar información"). */
  abstract getMyProfile(): Observable<Profile>;
  /** Update own name/email/phone (HU-16 crit. 2/3: "Actualizar datos" / "Datos inválidos"). */
  abstract updateMyProfile(payload: UpdateProfilePayload): Observable<Profile>;
}
