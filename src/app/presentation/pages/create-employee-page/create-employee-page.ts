import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { CreateEmployeeForm } from '../../components/create-employee-form/create-employee-form';
import { CreateEmployeePayload, EmployeeApiError, FieldErrors, Role } from '../../../domain/models/employee.model';
import { EmployeeRepository } from '../../../domain/repositories/employee.repository';

/**
 * Admin-only page for provisioning employee accounts with a role (HU-02). Distinct from
 * `AuthPage` (customer self-registration) — employees/admins are provisioned separately.
 */
@Component({
  selector: 'app-create-employee-page',
  imports: [TuiButton, CreateEmployeeForm],
  templateUrl: './create-employee-page.html',
  styleUrl: './create-employee-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEmployeePage implements OnInit {
  private readonly employeeRepository = inject(EmployeeRepository);

  protected readonly roles = signal<Role[]>([]);
  protected readonly rolesError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fieldErrors = signal<FieldErrors | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly created = signal(false);

  ngOnInit(): void {
    this.employeeRepository.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (error: EmployeeApiError) => this.rolesError.set(error.message),
    });
  }

  protected onSubmit(payload: CreateEmployeePayload): void {
    this.pending.set(true);
    this.fieldErrors.set(null);
    this.formError.set(null);

    this.employeeRepository.createEmployee(payload).subscribe({
      next: () => {
        this.pending.set(false);
        this.created.set(true);
      },
      error: (error: EmployeeApiError) => {
        this.pending.set(false);
        this.fieldErrors.set(error.fieldErrors ?? null);
        this.formError.set(error.fieldErrors ? null : error.message);
      },
    });
  }

  protected createAnother(): void {
    this.created.set(false);
  }
}
