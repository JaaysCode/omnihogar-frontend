import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AdminRolesPage } from './admin-roles-page';
import { ADMINISTRADOR_ROLE_ID, Permission, Role } from '../../../domain/models/role.model';
import { RoleRepository } from '../../../domain/repositories/role.repository';

const ROLES: Role[] = [
  { id: ADMINISTRADOR_ROLE_ID, name: 'Administrador', description: 'Acceso total', permissions: [] },
  { id: 'r2', name: 'Jefe de Bodega', description: 'Gestiona la bodega', permissions: ['inventario.ajustar'] },
];

const PERMISSIONS: Permission[] = [
  { id: 'p1', name: 'inventario.ajustar', description: 'Ajustar inventario' },
];

describe('AdminRolesPage', () => {
  let fixture: ComponentFixture<AdminRolesPage>;
  let roleRepository: {
    getRoles: ReturnType<typeof vi.fn>;
    getPermissions: ReturnType<typeof vi.fn>;
    updateRolePermissions: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    roleRepository = { getRoles: vi.fn(), getPermissions: vi.fn(), updateRolePermissions: vi.fn() };
    roleRepository.getRoles.mockReturnValue(of(ROLES));
    roleRepository.getPermissions.mockReturnValue(of(PERMISSIONS));

    await TestBed.configureTestingModule({
      imports: [AdminRolesPage],
      providers: [provideRouter([]), provideTaiga(), { provide: RoleRepository, useValue: roleRepository }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRolesPage);
    fixture.detectChanges();
  });

  it('lists every role, showing the permission description and never the raw code', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Administrador');
    expect(text).toContain('Jefe de Bodega');
    expect(text).toContain('Ajustar inventario');
    expect(text).not.toContain('inventario.ajustar');
  });

  it('shows "Todos los permisos" for the Administrador role and disables its edit control', () => {
    expect(fixture.nativeElement.textContent).toContain('Todos los permisos');
    const disabledEdit = fixture.debugElement.query(By.css('button[disabled]'));
    expect(disabledEdit).toBeTruthy();
  });

  it('renders an edit link for a non-Administrador role', () => {
    const editLink = fixture.debugElement.query(By.css('a[aria-label="Editar permisos"]'));
    expect(editLink).toBeTruthy();
  });
});
