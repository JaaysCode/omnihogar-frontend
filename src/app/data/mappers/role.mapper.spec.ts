import { HttpErrorResponse } from '@angular/common/http';
import { toPermission, toRole, toRoleApiError } from './role.mapper';
import { PermissionDto, RoleDto } from '../services/role-api.dto';

describe('toRole', () => {
  it('maps the DTO, defaulting a missing permissions array to []', () => {
    const dto: RoleDto = { id: 'r1', name: 'Jefe de Bodega', description: 'Gestiona la bodega' };

    expect(toRole(dto)).toEqual({
      id: 'r1',
      name: 'Jefe de Bodega',
      description: 'Gestiona la bodega',
      permissions: [],
    });
  });

  it('keeps the permissions array when present', () => {
    const dto: RoleDto = {
      id: 'r2',
      name: 'Asesor de Tienda',
      description: null,
      permissions: ['pos.registrar_venta', 'productos.ver_catalogo'],
    };

    expect(toRole(dto).permissions).toEqual(['pos.registrar_venta', 'productos.ver_catalogo']);
  });
});

describe('toPermission', () => {
  it('maps the DTO 1:1', () => {
    const dto: PermissionDto = { id: 'p1', name: 'inventario.ajustar', description: 'Ajustar inventario' };

    expect(toPermission(dto)).toEqual({ id: 'p1', name: 'inventario.ajustar', description: 'Ajustar inventario' });
  });
});

describe('toRoleApiError', () => {
  it('maps a 400 with an errors dict to the first field message, lowercasing keys', () => {
    const httpError = new HttpErrorResponse({
      status: 400,
      error: {
        status: 400,
        title: 'Validation failed',
        errors: { RoleId: ['Los permisos del rol Administrador no se pueden modificar.'] },
      },
    });

    const error = toRoleApiError(httpError);

    expect(error.fieldErrors).toEqual({
      roleId: ['Los permisos del rol Administrador no se pueden modificar.'],
    });
    expect(error.message).toBe('Los permisos del rol Administrador no se pueden modificar.');
  });

  it('maps a 403 to a forbidden message', () => {
    expect(toRoleApiError(new HttpErrorResponse({ status: 403 })).message).toBe(
      'No tienes permisos para gestionar roles.',
    );
  });

  it('maps a 404 to a not-found message', () => {
    expect(toRoleApiError(new HttpErrorResponse({ status: 404 })).message).toBe('El rol solicitado no existe.');
  });

  it('maps a network failure (status 0) to a connectivity message', () => {
    expect(toRoleApiError(new HttpErrorResponse({ status: 0 })).message).toContain('No se pudo conectar con el servidor');
  });

  it('maps a non-HttpErrorResponse to a generic message', () => {
    expect(toRoleApiError(new Error('boom')).message).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
