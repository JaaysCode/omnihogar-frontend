import { mergeApplicationConfig, ApplicationConfig, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { WA_WINDOW } from '@ng-web-apis/common';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Platform-server's Window emulation is missing browser-only APIs that
    // Taiga UI reads at bootstrap (matchMedia for TUI_DARK_MODE,
    // requestAnimationFrame for its scrollbar/animation services). Patch
    // them once here, at the single place the whole app gets its `window`
    // from, instead of chasing each Taiga token that touches one. Server
    // renders are static, so inert fallbacks are enough — the client
    // re-evaluates the real APIs on hydration.
    {
      provide: WA_WINDOW,
      useFactory: (): Window => {
        const win = inject(DOCUMENT).defaultView;

        if (!win) {
          throw new Error('Window is not available');
        }

        win.requestAnimationFrame ??= (callback: FrameRequestCallback): number =>
          setTimeout(() => callback(Date.now()), 16) as unknown as number;
        win.cancelAnimationFrame ??= (handle: number): void => clearTimeout(handle);
        win.matchMedia ??= (query: string): MediaQueryList =>
          ({
            matches: false,
            media: query,
            onchange: null,
            addListener: (): void => undefined,
            removeListener: (): void => undefined,
            addEventListener: (): void => undefined,
            removeEventListener: (): void => undefined,
            dispatchEvent: (): boolean => false,
          }) as MediaQueryList;

        return win;
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
