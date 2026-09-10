import { Observable } from 'rxjs';
import { Permission, Role } from '../models/role.model';

/**
 * Domain-facing contract for role/permission management (HU-31). The presentation layer
 * depends on this abstract class (Angular's DI token pattern), never on the concrete HTTP
 * implementation in `data/`.
 */
export abstract class RoleRepository {
  /** All business roles, each with its configured permission names (HU-31 crit. 1). */
  abstract getRoles(): Observable<Role[]>;
  /** The full permission catalogue, for the role-edit checklist. */
  abstract getPermissions(): Observable<Permission[]>;
  /**
   * Replace a role's allowed permissions (HU-31 crit. 3). The backend revokes the refresh
   * tokens of every employee holding the role, so they get fresh claims on re-login.
   */
  abstract updateRolePermissions(roleId: string, permissions: string[]): Observable<void>;
}
