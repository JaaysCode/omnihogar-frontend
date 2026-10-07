import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { AdminTabBar } from '../../components/admin-tab-bar/admin-tab-bar';
import { EditRolePermissionsPage } from '../edit-role-permissions-page/edit-role-permissions-page';
import { ADMINISTRADOR_ROLE_ID, Role, RoleApiError } from '../../../domain/models/role.model';
import { RoleRepository } from '../../../domain/repositories/role.repository';

/** Nombre visible de cada módulo, según el prefijo del código de permiso (p. ej. "inventario."). */
const MODULE_LABELS: Readonly<Record<string, string>> = {
  inventario: $localize`:@@roles.module.inventario:Inventario`,
  productos: $localize`:@@roles.module.productos:Productos`,
  pedidos: $localize`:@@roles.module.pedidos:Pedidos`,
  pos: $localize`:@@roles.module.pos:Punto de venta`,
  usuarios: $localize`:@@roles.module.usuarios:Usuarios`,
};

export type RolesView = 'roles' | 'matrix';

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

  /** Pestaña activa: lista de roles o matriz de permisos. Separa el detalle de la tabla. */
  protected readonly view = signal<RolesView>('roles');

  /** Permisos agrupados por módulo (prefijo antes del punto), para la matriz. */
  protected readonly permissionGroups = computed(() => {
    const groups = new Map<string, { key: string; label: string; items: { name: string; label: string }[] }>();
    for (const permission of this.permissionCatalog()) {
      const key = permission.name.split('.')[0];
      let group = groups.get(key);
      if (!group) {
        group = { key, label: MODULE_LABELS[key] ?? key, items: [] };
        groups.set(key, group);
      }
      group.items.push(permission);
    }
    return [...groups.values()];
  });

  /**
   * Catálogo de permisos para la matriz (filas). Se muestra la descripción en español; el código
   * crudo (p. ej. "inventario.ajustar") nunca llega a la UI.
   */
  protected readonly permissionCatalog = signal<readonly { name: string; label: string }[]>([]);

  ngOnInit(): void {
    this.roleRepository.getPermissions().subscribe({
      next: (permissions) =>
        this.permissionCatalog.set(permissions.map((p) => ({ name: p.name, label: p.description ?? p.name }))),
      // No fatal: la matriz simplemente no muestra filas hasta reintentar.
      error: () => this.permissionCatalog.set([]),
    });
    this.loadRoles();
  }

  /** El rol Administrador siempre tiene todos los permisos, aunque su lista venga vacía. */
  protected hasPermission(role: Role, name: string): boolean {
    return role.id === ADMINISTRADOR_ROLE_ID || role.permissions.includes(name);
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
