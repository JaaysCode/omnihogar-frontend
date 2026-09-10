import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TuiAlertService, TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import { Employee, EmployeeApiError } from '../../../domain/models/employee.model';
import { Role } from '../../../domain/models/role.model';
import { EmployeeRepository } from '../../../domain/repositories/employee.repository';

/**
 * Modal content for reassigning an existing employee to a different role (HU-31 crit. 2).
 * Rendered by admin-users-page inside an `@if`/`@defer` block driven by the `?editRole` query
 * param. Same modal shell as edit-role-permissions-page; role picker reuses the Taiga dropdown
 * pattern from create-employee-form. On save the backend revokes that employee's refresh tokens.
 */
@Component({
  selector: 'app-edit-employee-role-page',
  imports: [TuiButton, TuiChevron, TuiDataList, TuiDropdown, TuiIcon],
  templateUrl: './edit-employee-role-page.html',
  styleUrl: './edit-employee-role-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditEmployeeRolePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly employeeRepository = inject(EmployeeRepository);
  private readonly document = inject(DOCUMENT);
  private readonly alerts = inject(TuiAlertService);

  /** Employee id to load — required, set from the parent's `?editRole` query param. */
  readonly employeeId = input.required<string>();

  /** Emitted on close button, backdrop click, Escape, or successful update — parent clears `?editRole`. */
  readonly closed = output<void>();

  @ViewChild('panel') private readonly panel?: ElementRef<HTMLElement>;

  protected readonly employee = signal<Employee | null>(null);
  protected readonly roles = signal<Role[]>([]);
  protected readonly selectedRoleId = signal<string | null>(null);
  protected readonly menuOpen = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly rolePlaceholder = $localize`:@@users.editRole.placeholder:Selecciona un rol`;

  protected readonly ready = computed(() => this.employee() !== null && this.roles().length > 0);

  protected readonly selectedRoleName = computed(() => {
    const id = this.selectedRoleId();
    return this.roles().find((r) => r.id === id)?.name ?? this.rolePlaceholder;
  });

  protected readonly dirty = computed(() => {
    const original = this.employee()?.roleId ?? null;
    return this.selectedRoleId() !== null && this.selectedRoleId() !== original;
  });

  constructor() {
    // Lock background scroll while the modal is open; restored in ngOnDestroy.
    this.document.body.style.overflow = 'hidden';
  }

  ngOnInit(): void {
    this.employeeRepository.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (error: EmployeeApiError) => this.loadError.set(error.message),
    });

    this.employeeRepository.getEmployeeById(this.employeeId()).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        this.selectedRoleId.set(employee.roleId);
      },
      error: (error: EmployeeApiError) => this.loadError.set(error.message),
    });
  }

  ngAfterViewInit(): void {
    // Move focus into the dialog so screen readers announce it and Tab stays sensible.
    this.panel?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.closed.emit();
  }

  protected onSelectRole(role: Role): void {
    this.selectedRoleId.set(role.id);
    this.menuOpen.set(false);
  }

  protected onSubmit(): void {
    const employee = this.employee();
    const roleId = this.selectedRoleId();
    if (!employee || !roleId) {
      return;
    }

    this.pending.set(true);
    this.formError.set(null);

    this.employeeRepository.changeRole(employee.id, roleId).subscribe({
      next: () => {
        this.alerts
          .open($localize`:@@users.editRole.success:Rol actualizado. El empleado lo verá al volver a iniciar sesión.`, {
            appearance: 'positive',
          })
          .subscribe();
        this.closed.emit();
      },
      error: (error: EmployeeApiError) => {
        this.pending.set(false);
        const firstFieldError = error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] : undefined;
        this.formError.set(firstFieldError ?? error.message);
      },
    });
  }
}
