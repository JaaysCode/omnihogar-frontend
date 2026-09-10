import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { PermissionDto, RoleDto, SetRolePermissionsRequestDto } from './role-api.dto';

/**
 * Raw HTTP client for the `/roles` endpoints (HU-31). Transport-only: no error translation,
 * no domain mapping — see `RoleRepositoryImpl` for that.
 */
@Injectable({ providedIn: 'root' })
export class RoleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/roles`);
  }

  getPermissions(): Observable<PermissionDto[]> {
    return this.http.get<PermissionDto[]>(`${this.baseUrl}/roles/permissions`);
  }

  updateRolePermissions(roleId: string, permissions: string[]): Observable<void> {
    const body: SetRolePermissionsRequestDto = { permissions };
    return this.http.put<void>(`${this.baseUrl}/roles/${roleId}/permissions`, body);
  }
}
