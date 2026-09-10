import { Routes } from '@angular/router';
import { AuthPage } from './presentation/pages/auth-page/auth-page';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { rootRedirectGuard } from './core/guards/root-redirect.guard';

// Los nombres de política/permiso coinciden con AppPermissions.cs del backend.
const P = {
  usuarios: 'usuarios.gestionar',
  productos: 'productos.gestionar',
  inventario: 'inventario.consultar',
  pos: 'pos.registrar_venta',
  pedidos: 'pedidos.consultar',
} as const;

export const routes: Routes = [
  { path: 'register', component: AuthPage, data: { mode: 'register' }, title: 'Crear cuenta · OmniHogar' },
  { path: 'login', component: AuthPage, data: { mode: 'login' }, title: 'Iniciar sesión · OmniHogar' },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./presentation/pages/admin-dashboard-page/admin-dashboard-page').then((m) => m.AdminDashboardPage),
    title: 'Panel de Control · OmniHogar',
    canActivate: [authGuard],
  },
  {
    // "Agregar Nuevo Usuario" opens create-employee-page as a `?create` query-param-driven modal
    // on top of this page (see admin-users-page.ts/.html) instead of a separate route — still
    // deep-linkable/bookmarkable/back-button-safe via /admin/users?create=1.
    path: 'admin/users',
    loadComponent: () => import('./presentation/pages/admin-users-page/admin-users-page').then((m) => m.AdminUsersPage),
    title: 'Usuarios · OmniHogar',
    canActivate: [permissionGuard(P.usuarios)],
  },
  {
    // HU-31 — gestión de roles y permisos. Mismo permiso que Usuarios (usuarios.gestionar).
    // "Editar" de una fila abre edit-role-permissions-page como modal `?edit=<roleId>` sobre
    // esta página, igual que admin-products-page.
    path: 'admin/roles',
    loadComponent: () => import('./presentation/pages/admin-roles-page/admin-roles-page').then((m) => m.AdminRolesPage),
    title: 'Roles y Permisos · OmniHogar',
    canActivate: [permissionGuard(P.usuarios)],
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./presentation/pages/product-catalog-page/product-catalog-page').then((m) => m.ProductCatalogPage),
    title: 'Catálogo · OmniHogar',
  },
  {
    // HU-05 — carrito del cliente. Requiere sesión (el carrito vive en el servidor por usuario).
    path: 'cart',
    loadComponent: () => import('./presentation/pages/cart-page/cart-page').then((m) => m.CartPage),
    title: 'Carrito · OmniHogar',
    canActivate: [authGuard],
  },
  {
    // "Nuevo Producto" / row "Editar" open create-product-page / edit-product-page as
    // `?create` / `?edit` query-param-driven modals on top of this page (see
    // admin-products-page.ts/.html) instead of separate routes — still
    // deep-linkable/bookmarkable/back-button-safe via /admin/products?create=1 or ?edit=<id>.
    path: 'admin/products',
    loadComponent: () =>
      import('./presentation/pages/admin-products-page/admin-products-page').then((m) => m.AdminProductsPage),
    title: 'Productos · OmniHogar',
    canActivate: [permissionGuard(P.productos)],
  },
  {
    path: 'admin/pos',
    loadComponent: () => import('./presentation/pages/pos-page/pos-page').then((m) => m.PosPage),
    title: 'Punto de Venta · OmniHogar',
    canActivate: [permissionGuard(P.pos)],
  },
  {
    // Detail view opens as a `?order` query-param-driven modal on top of this page (see
    // orders-page.ts/.html) instead of a separate route — deep-linkable/bookmarkable like
    // /admin/products?create=1.
    path: 'admin/orders',
    loadComponent: () => import('./presentation/pages/orders-page/orders-page').then((m) => m.OrdersPage),
    title: 'Pedidos · OmniHogar',
    canActivate: [permissionGuard(P.pedidos)],
  },
  {
    // HU-11 — consulta de stock. Abierta a administrador, jefe de bodega, coordinador de
    // despacho y asesor de tienda (todos tienen inventario.consultar). "Agregar Unidades"
    // abre add-stock-page como modal `?addStock` sobre esta página.
    path: 'inventario',
    loadComponent: () =>
      import('./presentation/pages/admin-inventory-page/admin-inventory-page').then((m) => m.AdminInventoryPage),
    title: 'Inventario · OmniHogar',
    canActivate: [permissionGuard(P.inventario)],
  },
  { path: '', pathMatch: 'full', canActivate: [rootRedirectGuard], children: [] },
];
