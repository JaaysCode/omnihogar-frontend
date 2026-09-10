import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of } from 'rxjs';
import { vi } from 'vitest';
import { EditRolePermissionsPage } from './edit-role-permissions-page';
import { Permission, Role } from '../../../domain/models/role.model';
import { RoleRepository } from '../../../domain/repositories/role.repository';

const PERMISSIONS: Permission[] = [
  { id: 'p1', name: 'inventario.consultar', description: 'Consultar inventario' },
  { id: 'p2', name: 'inventario.ajustar', description: 'Ajustar inventario' },
];

const ROLE: Role = {
  id: 'r2',
  name: 'Jefe de Bodega',
  description: 'Gestiona la bodega',
  permissions: ['inventario.ajustar'],
};

describe('EditRolePermissionsPage', () => {
  let fixture: ComponentFixture<EditRolePermissionsPage>;
  let roleRepository: {
    getRoles: ReturnType<typeof vi.fn>;
    getPermissions: ReturnType<typeof vi.fn>;
    updateRolePermissions: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    roleRepository = { getRoles: vi.fn(), getPermissions: vi.fn(), updateRolePermissions: vi.fn() };
    roleRepository.getRoles.mockReturnValue(of([ROLE]));
    roleRepository.getPermissions.mockReturnValue(of(PERMISSIONS));
    roleRepository.updateRolePermissions.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [EditRolePermissionsPage],
      providers: [
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: RoleRepository, useValue: roleRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditRolePermissionsPage);
    fixture.componentRef.setInput('roleId', 'r2');
    fixture.detectChanges();
  });

  function checkboxes(): HTMLInputElement[] {
    return fixture.debugElement.queryAll(By.css('input[type="checkbox"]')).map((d) => d.nativeElement);
  }

  it('pre-checks the permissions the role already grants', () => {
    const boxes = checkboxes();
    expect(boxes).toHaveLength(2);
    // PERMISSIONS[0] = inventario.consultar (not granted), [1] = inventario.ajustar (granted)
    expect(boxes[0].checked).toBe(false);
    expect(boxes[1].checked).toBe(true);
  });

  it('submits the toggled permission set and closes', () => {
    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    // Tick on "inventario.consultar", leaving "inventario.ajustar" on too.
    checkboxes()[0].click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

    expect(roleRepository.updateRolePermissions).toHaveBeenCalledWith('r2', [
      'inventario.ajustar',
      'inventario.consultar',
    ]);
    expect(closedSpy).toHaveBeenCalled();
  });

  it('shows a not-found error when the role id has no match', () => {
    fixture = TestBed.createComponent(EditRolePermissionsPage);
    fixture.componentRef.setInput('roleId', 'missing');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El rol solicitado no existe.');
  });
});
