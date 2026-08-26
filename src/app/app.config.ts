import { provideTaiga } from '@taiga-ui/core';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { AuthRepository } from './domain/repositories/auth.repository';
import { AuthRepositoryImpl } from './data/repositories/auth.repository.impl';
import { AuthRouteReuseStrategy } from './core/routing/auth-route-reuse-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideTaiga(),
    { provide: AuthRepository, useClass: AuthRepositoryImpl },
    // Lets the register <-> login switch animate with a CSS `transform` transition instead of
    // a hard cut — see auth-route-reuse-strategy.ts and auth-page.scss.
    { provide: RouteReuseStrategy, useClass: AuthRouteReuseStrategy },
  ],
};
