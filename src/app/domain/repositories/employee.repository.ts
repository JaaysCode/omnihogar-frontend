import { Observable } from 'rxjs';
import { CreateEmployeePayload, Employee } from '../models/employee.model';
import { Role } from '../models/role.model';

/**
 * Domain-facing contract for employee provisioning. The presentation layer depends on
 * this abstract class (Angular's DI token pattern), never on the concrete HTTP
 * implementation in `data/`.
 */
export abstract class EmployeeRepository {
  abstract createEmployee(payload: CreateEmployeePayload): Observable<string>;
  abstract getRoles(): Observable<Role[]>;
  /** Admin "Gestión de Usuarios" list — employee accounts only. */
  abstract getEmployees(): Observable<Employee[]>;
  /** Single employee account, for the "cambiar rol" editor (HU-31 crit. 2). */
  abstract getEmployeeById(id: string): Observable<Employee>;
  /**
   * Reassign an employee to a different role (HU-31 crit. 2). The backend revokes that
   * employee's refresh tokens, so their permissions refresh on re-login.
   */
  abstract changeRole(employeeId: string, roleId: string): Observable<void>;
}
