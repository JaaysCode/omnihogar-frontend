import { Routes } from '@angular/router';
import { AuthPage } from './presentation/pages/auth-page/auth-page';

export const routes: Routes = [
  { path: 'register', component: AuthPage, data: { mode: 'register' }, title: 'Create account · OmniHogar' },
  { path: 'login', component: AuthPage, data: { mode: 'login' }, title: 'Sign in · OmniHogar' },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
];
