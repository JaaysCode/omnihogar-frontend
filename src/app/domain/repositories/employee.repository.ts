import { Observable } from 'rxjs';
import { CreateEmployeePayload, Employee, Role } from '../models/employee.model';

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
}
