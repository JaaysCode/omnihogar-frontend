import { Routes } from '@angular/router';
import { AuthPage } from './presentation/pages/auth-page/auth-page';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'register', component: AuthPage, data: { mode: 'register' }, title: 'Create account · OmniHogar' },
  { path: 'login', component: AuthPage, data: { mode: 'login' }, title: 'Sign in · OmniHogar' },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./presentation/pages/admin-dashboard-page/admin-dashboard-page').then((m) => m.AdminDashboardPage),
    title: 'Panel de control · OmniHogar',
    canActivate: [adminGuard],
  },
  {
    // "Agregar Nuevo Usuario" opens create-employee-page as a `?create` query-param-driven modal
    // on top of this page (see admin-users-page.ts/.html) instead of a separate route — still
    // deep-linkable/bookmarkable/back-button-safe via /admin/users?create=1.
    path: 'admin/users',
    loadComponent: () => import('./presentation/pages/admin-users-page/admin-users-page').then((m) => m.AdminUsersPage),
    title: 'Usuarios · OmniHogar',
    canActivate: [adminGuard],
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./presentation/pages/product-catalog-page/product-catalog-page').then((m) => m.ProductCatalogPage),
    title: 'Catálogo · OmniHogar',
  },
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./presentation/pages/admin-products-page/admin-products-page').then((m) => m.AdminProductsPage),
    title: 'Productos · OmniHogar',
    canActivate: [adminGuard],
  },
  {
    path: 'admin/products/new',
    loadComponent: () =>
      import('./presentation/pages/create-product-page/create-product-page').then((m) => m.CreateProductPage),
    title: 'Nuevo producto · OmniHogar',
    canActivate: [adminGuard],
  },
  {
    path: 'admin/products/:id/edit',
    loadComponent: () =>
      import('./presentation/pages/edit-product-page/edit-product-page').then((m) => m.EditProductPage),
    title: 'Editar producto · OmniHogar',
    canActivate: [adminGuard],
  },
  {
    // Detail view opens as a `?order` query-param-driven modal on top of this page (see
    // orders-page.ts/.html) instead of a separate route — deep-linkable/bookmarkable like
    // /admin/products?create=1.
    path: 'admin/orders',
    loadComponent: () => import('./presentation/pages/orders-page/orders-page').then((m) => m.OrdersPage),
    title: 'Pedidos · OmniHogar',
    canActivate: [adminGuard],
  },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
