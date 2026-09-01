# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Angular 22 (standalone components, zoneless change detection, SSR/hydration) · pnpm · Taiga UI (`@taiga-ui/core|cdk|kit|icons`) as the single component/design system. Node version pinned in `.nvmrc`, package manager pinned in `package.json`.

## Commands

```bash
pnpm lint    # ng lint (angular-eslint)
pnpm test    # ng test — Vitest, jsdom
pnpm build   # SSR build + prerender
pnpm start   # ng serve, http://localhost:4200
pnpm i18n:extract  # ng extract-i18n
```

All three of lint/test/build must pass before merging. Run a single test file with `pnpm test -- path/to/file.spec.ts` (Vitest args pass through `ng test`).

## Architecture

`src/app/` is split by clean-architecture layer, and dependency direction is enforced one way:

```
presentation ─┐
              ├──> domain <── core
data ─────────┘
```

- `domain/` — models, abstract repository classes, use-cases. No framework or Taiga imports. This is the DI contract: presentation depends on the `abstract class XRepository` here, never on the concrete impl.
- `data/` — repository implementations (`*.repository.impl.ts`), HTTP services (`*-api.service.ts`), DTOs (`*-api.dto.ts`), and DTO↔domain mappers (`*.mapper.ts`). HTTP errors are translated into domain error types inside the mapper (e.g. `toProductApiError`), not in the repository or component.
- `presentation/` — pages, components, layouts. Only this layer touches Taiga UI.
- `core/` — app-wide config (`config/api.config.ts`), guards, interceptors, singleton services, routing strategy.
- `shared/` — directives/pipes/utils reused across layers, framework-agnostic where possible.

Each domain feature (auth, employee, product, ...) repeats the same four-file shape: `domain/models/x.model.ts` (+ abstract `domain/repositories/x.repository.ts`) → `data/services/x-api.dto.ts` + `x-api.service.ts` → `data/mappers/x.mapper.ts` → `data/repositories/x.repository.impl.ts`. New concrete repositories get wired into DI in `app.config.ts` (`{ provide: XRepository, useClass: XRepositoryImpl }`).

### Routing

- `app.routes.ts` — client routes. Feature pages are lazy (`loadComponent`); admin-only routes carry `canActivate: [adminGuard]`.
- `app.routes.server.ts` — SSR render-mode per route. Any route with admin-only or live/mutable data must be `RenderMode.Client` (not prerenderable); only the static catch-all is `RenderMode.Prerender`. Add new admin/live-data routes to both files.
- `AuthRouteReuseStrategy` (`core/routing/`) keeps the `/register` ↔ `/login` `AuthPage` instance alive across navigation so the mode switch can animate with a CSS transform instead of destroy/recreate. Extend its `shouldReuseRoute` check if another route pair needs the same treatment.

### Auth

- `AuthSessionService` (`core/services/`) holds the session (tokens) in a signal, persisted to `localStorage` via `WA_LOCAL_STORAGE` (from `@ng-web-apis/common`), which is `null` during SSR — every access is guarded with `?.`.
- `authInterceptor` attaches `Authorization: Bearer <token>` from the stored session to every request; endpoints that don't need auth simply ignore the header.
- `adminGuard` decodes the JWT client-side (unverified) and checks the `ClaimTypes.Role` claim URI (`http://schemas.microsoft.com/ws/2008/06/identity/claims/role` — matches the .NET backend's `TokenService.cs`) for `"Admin"`. This is a UI-only gate; real enforcement is the backend's `[Authorize(Roles = "Admin")]`.

### SSR quirks

`app.config.server.ts` patches `WA_WINDOW` (`requestAnimationFrame`, `matchMedia`, etc.) because platform-server's emulated `Window` is missing browser APIs Taiga UI reads at bootstrap. Server renders are static so inert fallbacks are fine; the client re-evaluates real APIs on hydration. If a new Taiga token/service breaks under SSR with a "not a function" error on `window.*`, add the missing shim here rather than chasing it at the call site.

## Design tokens & theming

Colour has one source of truth: `src/styles/_tokens.scss` — overrides Taiga UI's global CSS variables for light (`:root`) and dark (`[tuiTheme='dark']`). See taiga-ui.dev/colors and taiga-ui.dev/typography for what Taiga already covers before adding anything new. Project-specific concepts Taiga doesn't cover (e.g. layout sizing) live as `--oh-*` variables in the same file. Retheming for another tenant = editing hex values in `_tokens.scss`, nothing else.

Preference order when styling:
1. Override the global CSS variables in `_tokens.scss` (colour).
2. Use Taiga UI's LESS/SCSS mixins for new appearances.
3. Reach for Taiga config tokens / injectable signals (e.g. `TUI_DARK_MODE`).
4. Local/global style-class overrides — last resort only.

No Tailwind, no second design system.

`TUI_DARK_MODE` (`@taiga-ui/core`, injectable `WritableSignal<boolean>`) drives dark mode, initialising from `localStorage`/`prefers-color-scheme` and persisting changes via `TuiRoot`. No toggle UI ships yet. On the server it's overridden to a static `false` signal (see `app.config.server.ts`) since platform-server has no `matchMedia`/`localStorage`.

## i18n

UI strings use `$localize` with explicit IDs (`` $localize`:@@some.id:Text` ``), not a separate translation file lookup at the call site — see `toProductApiError` in `data/mappers/product.mapper.ts` for the pattern used for user-facing error messages. `@angular/localize/init` is a polyfill in `angular.json`.
