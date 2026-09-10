import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RoleRepositoryImpl } from './role.repository.impl';
import { RoleApiService } from '../services/role-api.service';
import { RoleApiError } from '../../domain/models/role.model';

describe('RoleRepositoryImpl', () => {
  let repository: RoleRepositoryImpl;
  let api: {
    getRoles: ReturnType<typeof vi.fn>;
    getPermissions: ReturnType<typeof vi.fn>;
    updateRolePermissions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = { getRoles: vi.fn(), getPermissions: vi.fn(), updateRolePermissions: vi.fn() };
    TestBed.configureTestingModule({
      providers: [RoleRepositoryImpl, { provide: RoleApiService, useValue: api }],
    });
    repository = TestBed.inject(RoleRepositoryImpl);
  });

  it('maps role DTOs to the domain shape', () => {
    api.getRoles.mockReturnValue(
      of([{ id: 'r1', name: 'Jefe de Bodega', description: null, permissions: ['inventario.ajustar'] }]),
    );

    let roles;
    repository.getRoles().subscribe((r) => (roles = r));

    expect(roles).toEqual([
      { id: 'r1', name: 'Jefe de Bodega', description: null, permissions: ['inventario.ajustar'] },
    ]);
  });

  it('maps permission DTOs to the domain shape', () => {
    api.getPermissions.mockReturnValue(of([{ id: 'p1', name: 'inventario.ajustar', description: 'Ajustar' }]));

    let permissions;
    repository.getPermissions().subscribe((p) => (permissions = p));

    expect(permissions).toEqual([{ id: 'p1', name: 'inventario.ajustar', description: 'Ajustar' }]);
  });

  it('passes the permission list through to the API on update', () => {
    api.updateRolePermissions.mockReturnValue(of(undefined));

    repository.updateRolePermissions('r1', ['inventario.consultar']).subscribe();

    expect(api.updateRolePermissions).toHaveBeenCalledWith('r1', ['inventario.consultar']);
  });

  it('translates a failed update into a RoleApiError', () => {
    api.updateRolePermissions.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, title: 'x', errors: { RoleId: ['El rol no existe.'] } },
          }),
      ),
    );

    let caught: RoleApiError | undefined;
    repository.updateRolePermissions('r1', []).subscribe({ error: (err) => (caught = err) });

    expect(caught).toBeInstanceOf(RoleApiError);
    expect(caught?.fieldErrors).toEqual({ roleId: ['El rol no existe.'] });
  });
});
