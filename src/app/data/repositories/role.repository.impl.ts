import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Permission, Role } from '../../domain/models/role.model';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { toPermission, toRole, toRoleApiError } from '../mappers/role.mapper';
import { RoleApiService } from '../services/role-api.service';

@Injectable({ providedIn: 'root' })
export class RoleRepositoryImpl implements RoleRepository {
  private readonly api = inject(RoleApiService);

  getRoles(): Observable<Role[]> {
    return this.api.getRoles().pipe(
      map((dtos) => dtos.map(toRole)),
      catchError((error) => throwError(() => toRoleApiError(error))),
    );
  }

  getPermissions(): Observable<Permission[]> {
    return this.api.getPermissions().pipe(
      map((dtos) => dtos.map(toPermission)),
      catchError((error) => throwError(() => toRoleApiError(error))),
    );
  }

  updateRolePermissions(roleId: string, permissions: string[]): Observable<void> {
    return this.api
      .updateRolePermissions(roleId, permissions)
      .pipe(catchError((error) => throwError(() => toRoleApiError(error))));
  }
}
