import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { CreateEmployeePage } from '../create-employee-page/create-employee-page';
import { EditEmployeeRolePage } from '../edit-employee-role-page/edit-employee-role-page';
import { Employee, EmployeeApiError } from '../../../domain/models/employee.model';
import { EmployeeRepository } from '../../../domain/repositories/employee.repository';

const PAGE_SIZE = 10;
/** Cycled by a hash of the employee id so the same person always gets the same avatar color. */
const AVATAR_PALETTE = ['avatar--indigo', 'avatar--amber', 'avatar--sky', 'avatar--rose', 'avatar--emerald'] as const;

/**
 * Admin-only employee account management ("Gestión de Usuarios"). "Agregar Nuevo Usuario" opens
 * create-employee-page as a modal driven by the `?create` query param (bound via
 * withComponentInputBinding) instead of navigating away from the list — same pattern as
 * admin-products-page's "Nuevo Producto".
 */
@Component({
  selector: 'app-admin-users-page',
  imports: [RouterLink, AdminSidebar, AdminTabBar, CreateEmployeePage, EditEmployeeRolePage, TuiButton, TuiIcon],
  templateUrl: './admin-users-page.html',
  styleUrl: './admin-users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersPage implements OnInit {
  private readonly employeeRepository = inject(EmployeeRepository);
  private readonly router = inject(Router);

  /** Bound from the `?create` query param by withComponentInputBinding (see app.config.ts). */
  readonly create = input<string | undefined>(undefined);

  /** Bound from the `?editRole` query param (holds the employee id) by withComponentInputBinding. */
  readonly editRole = input<string | undefined>(undefined);

  protected readonly employees = signal<Employee[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly page = signal(1);

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil((this.employees()?.length ?? 0) / PAGE_SIZE)));

  protected readonly pageItems = computed(() => {
    const list = this.employees();
    if (!list) {
      return null;
    }
    const start = (this.page() - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  });

  protected readonly rangeLabel = computed(() => {
    const total = this.employees()?.length ?? 0;
    if (total === 0) {
      return null;
    }
    const start = (this.page() - 1) * PAGE_SIZE + 1;
    const end = Math.min(this.page() * PAGE_SIZE, total);
    return { start, end, total };
  });

  ngOnInit(): void {
    this.loadEmployees();
  }

  /** Also re-run when the "Agregar Nuevo Usuario" modal closes, so a just-created account shows up. */
  protected loadEmployees(): void {
    this.employeeRepository.getEmployees().subscribe({
      next: (employees) => this.employees.set(employees),
      error: (error: EmployeeApiError) => this.loadError.set(error.message),
    });
  }

  protected onModalClosed(): void {
    // Plain absolute navigate with no queryParams — matches AdminProductsPage's onModalClosed.
    // `queryParamsHandling: 'merge'` + `{ create: null }` is unreliable for stripping a param and
    // can silently no-op under the router's default `onSameUrlNavigation: 'ignore'`.
    void this.router.navigate(['/admin/users']);
    this.page.set(1);
    this.loadEmployees();
  }

  protected goToPage(target: number): void {
    this.page.set(Math.min(Math.max(1, target), this.totalPages()));
  }

  protected initials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  }

  protected avatarClass(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  }
}
