import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { EditRolePermissionsPage } from '../edit-role-permissions-page/edit-role-permissions-page';
import { ADMINISTRADOR_ROLE_ID, Role, RoleApiError } from '../../../domain/models/role.model';
import { RoleRepository } from '../../../domain/repositories/role.repository';

/**
 * Admin-only role/permission management (HU-31 crit. 1 + 3). Row-level "Editar" opens
 * edit-role-permissions-page as a modal driven by the `?edit` query param (bound via
 * withComponentInputBinding) instead of navigating away — same pattern as admin-products-page.
 * The seeded "Administrador" role is read-only: it always holds every permission.
 */
@Component({
  selector: 'app-admin-roles-page',
  imports: [RouterLink, AdminSidebar, AdminTabBar, EditRolePermissionsPage, TuiIcon],
  templateUrl: './admin-roles-page.html',
  styleUrl: './admin-roles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRolesPage implements OnInit {
  private readonly roleRepository = inject(RoleRepository);
  private readonly router = inject(Router);

  /** Bound from the `?edit` query param (holds the role id) by withComponentInputBinding. */
  readonly edit = input<string | undefined>(undefined);

  protected readonly roles = signal<Role[] | null>(null);
  protected readonly loadError = signal<string | null>(null);

  protected readonly adminRoleId = ADMINISTRADOR_ROLE_ID;

  /**
   * Permission name -> human-readable Spanish label. The UI never shows the raw permission
   * code (e.g. "inventario.ajustar"); this map resolves it to the seed description.
   */
  private readonly permissionLabels = signal<ReadonlyMap<string, string>>(new Map());

  protected readonly permissionLabelFor = computed(() => {
    const labels = this.permissionLabels();
    return (name: string): string => labels.get(name) ?? name;
  });

  ngOnInit(): void {
    this.roleRepository.getPermissions().subscribe({
      next: (permissions) =>
        this.permissionLabels.set(new Map(permissions.map((p) => [p.name, p.description ?? p.name]))),
      // Non-fatal: chips fall back to the raw name until this resolves/retries.
      error: () => this.permissionLabels.set(new Map()),
    });
    this.loadRoles();
  }

  /** Also re-run when the edit modal closes, so an updated permission set shows up. */
  protected loadRoles(): void {
    this.roleRepository.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (error: RoleApiError) => this.loadError.set(error.message),
    });
  }

  protected onModalClosed(): void {
    // Plain absolute navigate with no queryParams — matches AdminProductsPage's onModalClosed.
    void this.router.navigate(['/admin/roles']);
    this.loadRoles();
  }
}
