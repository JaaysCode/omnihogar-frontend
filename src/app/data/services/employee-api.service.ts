import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { CreateEmployeePayload } from '../../domain/models/employee.model';
import { CreateEmployeeRequestDto, RoleDto } from './employee-api.dto';

/**
 * Raw HTTP client for the `/employees` and `/roles` endpoints. Transport-only: no error
 * translation, no domain mapping — see `EmployeeRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  createEmployee(payload: CreateEmployeePayload): Observable<string> {
    const body: CreateEmployeeRequestDto = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone ?? null,
      roleId: payload.roleId,
    };
    return this.http.post<string>(`${this.baseUrl}/employees`, body);
  }

  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/roles`);
  }
}
