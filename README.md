# OmnihogarFrontend

Angular 22 (zoneless, SSR) · pnpm · Taiga UI · clean architecture.

## Stack

- **Angular 22**, standalone components, zoneless change detection, SSR/hydration.
- **pnpm** as package manager (`packageManager` pinned in `package.json`; Node version pinned in `.nvmrc`).
- **Taiga UI** (`@taiga-ui/core|cdk|kit|icons`) as the single component/design system.

## Architecture

`src/app/` is split by clean-architecture layer:

- `core/` — app-wide config, singleton services, cross-cutting utils.
- `domain/` — models, repository interfaces, use-cases. No framework/Taiga imports here.
- `data/` — repository implementations, HTTP services, DTO↔domain mappers.
- `presentation/` — pages, components, layouts. Only this layer touches Taiga UI.
- `shared/` — directives/pipes/utils reused across layers, framework-agnostic where possible.

Dependency direction: `presentation` / `data` → `domain` ← `core`. `domain` never imports outward.

## Design tokens & theming

Colour has **one source of truth**: `src/styles/_tokens.scss`. It overrides Taiga UI's
global CSS variables for light (`:root`) and dark (`[tuiTheme='dark']`) — see
[taiga-ui.dev/colors](https://taiga-ui.dev/colors) and
[taiga-ui.dev/typography](https://taiga-ui.dev/typography) for what Taiga already covers
before adding anything new. Project-specific concepts Taiga doesn't cover (e.g. layout
sizing) live as `--oh-*` variables in that same file.

Retheming for another tenant = editing the hex values in `_tokens.scss`, nothing else.

Preference order when styling:

1. Override the global CSS variables in `_tokens.scss` (colour).
2. Use Taiga UI's LESS/SCSS mixins for new appearances.
3. Reach for Taiga config tokens / injectable signals (e.g. `TUI_DARK_MODE`).
4. Local/global style-class overrides — last resort only.

No Tailwind, no second design system.

### Dark mode

`TUI_DARK_MODE` (`@taiga-ui/core`, injectable `WritableSignal<boolean>`) drives dark mode.
It initialises from `localStorage` / `prefers-color-scheme` and persists manual changes
automatically via `TuiRoot`. No toggle UI ships yet — inject `TUI_DARK_MODE` and call
`.set()` when one is needed. On the server, `TUI_DARK_MODE` is overridden in
`app.config.server.ts` to a static `false` signal, since platform-server has no
`matchMedia`/`localStorage`; the client re-evaluates the real signal on hydration.

## Quality gates

```bash
pnpm lint    # angular-eslint
pnpm test    # vitest, jsdom
pnpm build   # SSR build + prerender
```

All three must pass before merging.

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
