import { provideTaiga } from '@taiga-ui/core';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { AuthRepository } from './domain/repositories/auth.repository';
import { AuthRepositoryImpl } from './data/repositories/auth.repository.impl';
import { AuthRouteReuseStrategy } from './core/routing/auth-route-reuse-strategy';
import { EmployeeRepository } from './domain/repositories/employee.repository';
import { EmployeeRepositoryImpl } from './data/repositories/employee.repository.impl';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTaiga(),
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    { provide: EmployeeRepository, useClass: EmployeeRepositoryImpl },
    // Lets the register <-> login switch animate with a CSS `transform` transition instead of
    // a hard cut — see auth-route-reuse-strategy.ts and auth-page.scss.
    { provide: RouteReuseStrategy, useClass: AuthRouteReuseStrategy },
  ],
};
