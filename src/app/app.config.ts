import { provideTaiga, TuiAlertService, TuiNotificationService } from '@taiga-ui/core';
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
import { RoleRepository } from './domain/repositories/role.repository';
import { RoleRepositoryImpl } from './data/repositories/role.repository.impl';
import { ProductRepository } from './domain/repositories/product.repository';
import { ProductRepositoryImpl } from './data/repositories/product.repository.impl';
import { OrderRepository } from './domain/repositories/order.repository';
import { OrderRepositoryImpl } from './data/repositories/order.repository.impl';
import { CartRepository } from './domain/repositories/cart.repository';
import { CartRepositoryImpl } from './data/repositories/cart.repository.impl';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTaiga(),
    // `TuiAlertService` (de @taiga-ui/core) es abstracta y no está `providedIn: 'root'`, así que
    // `inject(TuiAlertService)` lanza NG0201. La aliaseamos a la implementación concreta root.
    { provide: TuiAlertService, useExisting: TuiNotificationService },
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    { provide: EmployeeRepository, useClass: EmployeeRepositoryImpl },
    { provide: RoleRepository, useClass: RoleRepositoryImpl },
    { provide: ProductRepository, useClass: ProductRepositoryImpl },
    { provide: OrderRepository, useClass: OrderRepositoryImpl },
    { provide: CartRepository, useClass: CartRepositoryImpl },
    // Lets the register <-> login switch animate with a CSS `transform` transition instead of
    // a hard cut — see auth-route-reuse-strategy.ts and auth-page.scss.
    { provide: RouteReuseStrategy, useClass: AuthRouteReuseStrategy },
  ],
};
