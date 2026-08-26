import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { EmployeeRepository } from '../../domain/repositories/employee.repository';
import { CreateEmployeePayload, Role } from '../../domain/models/employee.model';
import { toEmployeeApiError, toRole } from '../mappers/employee.mapper';
import { EmployeeApiService } from '../services/employee-api.service';

@Injectable({ providedIn: 'root' })
export class EmployeeRepositoryImpl implements EmployeeRepository {
  private readonly api = inject(EmployeeApiService);

  createEmployee(payload: CreateEmployeePayload): Observable<string> {
    return this.api
      .createEmployee(payload)
      .pipe(catchError((error) => throwError(() => toEmployeeApiError(error))));
  }

  getRoles(): Observable<Role[]> {
    return this.api.getRoles().pipe(
      map((dtos) => dtos.map(toRole)),
      catchError((error) => throwError(() => toEmployeeApiError(error))),
    );
  }
}
