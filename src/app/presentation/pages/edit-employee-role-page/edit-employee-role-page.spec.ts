import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga, TuiAlertService } from '@taiga-ui/core';
import { EMPTY, of } from 'rxjs';
import { vi } from 'vitest';
import { EditEmployeeRolePage } from './edit-employee-role-page';
import { Employee } from '../../../domain/models/employee.model';
import { Role } from '../../../domain/models/role.model';
import { EmployeeRepository } from '../../../domain/repositories/employee.repository';

const ROLES: Role[] = [
  { id: 'r1', name: 'Asesor de Tienda', description: null, permissions: [] },
  { id: 'r2', name: 'Jefe de Bodega', description: null, permissions: [] },
];

const EMPLOYEE: Employee = {
  id: 'e1',
  fullName: 'Ana Pérez',
  email: 'ana@x.test',
  roleName: 'Asesor de Tienda',
  roleId: 'r1',
  status: true,
};

describe('EditEmployeeRolePage', () => {
  let fixture: ComponentFixture<EditEmployeeRolePage>;
  let employeeRepository: {
    getRoles: ReturnType<typeof vi.fn>;
    getEmployeeById: ReturnType<typeof vi.fn>;
    changeRole: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    employeeRepository = { getRoles: vi.fn(), getEmployeeById: vi.fn(), changeRole: vi.fn() };
    employeeRepository.getRoles.mockReturnValue(of(ROLES));
    employeeRepository.getEmployeeById.mockReturnValue(of(EMPLOYEE));
    employeeRepository.changeRole.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [EditEmployeeRolePage],
      providers: [
        provideTaiga(),
        { provide: TuiAlertService, useValue: { open: () => EMPTY } },
        { provide: EmployeeRepository, useValue: employeeRepository },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEmployeeRolePage);
    fixture.componentRef.setInput('employeeId', 'e1');
    fixture.detectChanges();
  });

  it('preselects the employee\'s current role and names the employee', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ana Pérez');
    expect(text).toContain('Asesor de Tienda');
  });

  it('keeps the submit button disabled until a different role is picked', () => {
    const submit = (): HTMLButtonElement =>
      fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(submit().disabled).toBe(true);

    fixture.componentInstance['onSelectRole'](ROLES[1]);
    fixture.detectChanges();

    expect(submit().disabled).toBe(false);
  });

  it('submits the new role id and closes', () => {
    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance['onSelectRole'](ROLES[1]);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

    expect(employeeRepository.changeRole).toHaveBeenCalledWith('e1', 'r2');
    expect(closedSpy).toHaveBeenCalled();
  });
});
