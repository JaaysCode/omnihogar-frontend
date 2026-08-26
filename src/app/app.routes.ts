import { Routes } from '@angular/router';
import { AuthPage } from './presentation/pages/auth-page/auth-page';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'register', component: AuthPage, data: { mode: 'register' }, title: 'Create account · OmniHogar' },
  { path: 'login', component: AuthPage, data: { mode: 'login' }, title: 'Sign in · OmniHogar' },
  {
    path: 'admin/employees/new',
    loadComponent: () =>
      import('./presentation/pages/create-employee-page/create-employee-page').then((m) => m.CreateEmployeePage),
    title: 'Create employee · OmniHogar',
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
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
