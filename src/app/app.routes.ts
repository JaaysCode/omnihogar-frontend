import { Routes } from '@angular/router';
import { AuthPage } from './presentation/pages/auth-page/auth-page';

export const routes: Routes = [
  { path: 'register', component: AuthPage, data: { mode: 'register' }, title: 'Create account · OmniHogar' },
  { path: 'login', component: AuthPage, data: { mode: 'login' }, title: 'Sign in · OmniHogar' },
  {
    path: 'admin/employees/new',
    loadComponent: () =>
      import('./presentation/pages/create-employee-page/create-employee-page').then((m) => m.CreateEmployeePage),
    title: 'Create employee · OmniHogar',
  },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
