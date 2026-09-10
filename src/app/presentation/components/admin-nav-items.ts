export interface AdminNavItem {
  readonly label: string;
  readonly icon: string;
  /** Shorter caption for the bottom tab bar, where a column is much narrower than the sidebar. */
  readonly compactLabel?: string;
  /** Omitted for sections that don't have a page yet — rendered inert. */
  readonly link?: string;
  /**
   * Permiso requerido para ver este ítem (coincide con AppPermissions.cs del backend).
   * Ausente = visible para cualquier empleado autenticado.
   */
  readonly requiredPermission?: string;
}

/**
 * Single source of truth for the admin panel's destinations (mock: OmniHogar Admin / "Centro
 * Logístico"). Shared by `AdminSidebar` (desktop column) and `AdminTabBar` (mobile bottom bar) so
 * both stay in lockstep — only `Panel de Control`, `Productos`, `Inventario`, `Ventas`, `Pedidos`
 * and `Usuarios` route anywhere today; `Logística`/`Reportes` render as inert placeholders so the
 * shell matches the design without claiming pages that don't exist yet.
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    label: $localize`:@@admin.nav.dashboard:Panel de Control`,
    compactLabel: $localize`:@@admin.nav.dashboard.compact:Panel`,
    icon: '@tui.layout-dashboard',
    link: '/admin/dashboard',
  },
  {
    label: $localize`:@@admin.nav.products:Productos`,
    icon: '@tui.package',
    link: '/admin/products',
    requiredPermission: 'productos.gestionar',
  },
  {
    label: $localize`:@@admin.nav.inventory:Inventario`,
    icon: '@tui.warehouse',
    link: '/inventario',
    requiredPermission: 'inventario.consultar',
  },
  {
    label: $localize`:@@admin.nav.sales:Ventas`,
    icon: '@tui.credit-card',
    link: '/admin/pos',
    requiredPermission: 'pos.registrar_venta',
  },
  {
    label: $localize`:@@admin.nav.orders:Pedidos`,
    icon: '@tui.clipboard-list',
    link: '/admin/orders',
    requiredPermission: 'pedidos.consultar',
  },
  { label: $localize`:@@admin.nav.logistics:Logística`, icon: '@tui.truck' },
  {
    label: $localize`:@@admin.nav.users:Usuarios`,
    icon: '@tui.users',
    link: '/admin/users',
    requiredPermission: 'usuarios.gestionar',
  },
  {
    label: $localize`:@@admin.nav.roles:Roles y Permisos`,
    compactLabel: $localize`:@@admin.nav.roles.compact:Roles`,
    icon: '@tui.shield',
    link: '/admin/roles',
    requiredPermission: 'usuarios.gestionar',
  },
  { label: $localize`:@@admin.nav.reports:Reportes`, icon: '@tui.bar-chart-3' },
];

/** Filtra los ítems que el usuario puede ver según sus permisos (HU-03 crit. 4). */
export function visibleNavItems(
  hasPermission: (permission: string) => boolean,
): readonly AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission),
  );
}
