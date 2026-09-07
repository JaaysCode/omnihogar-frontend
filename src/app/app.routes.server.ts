import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Admin-only, reads localStorage + a live authenticated API — not prerenderable.
    path: 'admin/employees/new',
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
    path: 'admin/products/new',
    renderMode: RenderMode.Client,
  },
  {
    // Dynamic :id segment Prerender can't enumerate, plus admin-only + live data.
    path: 'admin/products/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    // Admin-only + live order data — not prerenderable.
    path: 'admin/orders',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
