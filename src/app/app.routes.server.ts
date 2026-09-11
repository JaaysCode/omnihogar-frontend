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
    // HU-31 — admin-only + live role data. No prerenderizable.
    path: 'admin/roles',
    renderMode: RenderMode.Client,
  },
  {
    // Live catalog data — prerendering would bake in whatever products exist at build time.
    path: 'products',
    renderMode: RenderMode.Client,
  },
  {
    // HU-05 — carrito por usuario, requiere sesión. No prerenderizable.
    path: 'cart',
    renderMode: RenderMode.Client,
  },
  {
    // HU-08/HU-09 — checkout, requiere sesión. No prerenderizable.
    path: 'checkout',
    renderMode: RenderMode.Client,
  },
  {
    // Vuelta desde Mercado Pago con datos de la transacción en la URL. No prerenderizable.
    path: 'checkout/result',
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
    // HU-11 — live stock data, permiso inventario.consultar. No prerenderizable.
    path: 'inventario',
    renderMode: RenderMode.Client,
  },
  {
    // Redirección por rol en el guard — no prerenderizable.
    path: '',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
