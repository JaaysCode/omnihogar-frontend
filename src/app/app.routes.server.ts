import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Admin-only + live stats/catalog data — not prerenderable.
    path: 'admin/dashboard',
    renderMode: RenderMode.Client,
  },
  {
    // Admin-only + live data (list) — not prerenderable.
    path: 'admin/users',
    renderMode: RenderMode.Client,
  },
  {
    // Live catalog data — prerendering would bake in whatever products exist at build time.
    path: 'products',
    renderMode: RenderMode.Client,
  },
  {
    // Admin-only + live data (list) — not prerenderable.
    path: 'admin/products',
    renderMode: RenderMode.Client,
  },
  {
    // Admin-only + live catalog data, plus an in-memory cart — not prerenderable.
    path: 'admin/pos',
    renderMode: RenderMode.Client,
  },
  {
    // Admin-only + live order data — not prerenderable.
    path: 'admin/orders',
    renderMode: RenderMode.Client,
  },
  {
    // Admin-only + live stock data — not prerenderable (same as the other admin/* routes).
    path: 'admin/inventory',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
