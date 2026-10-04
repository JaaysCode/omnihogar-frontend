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
    // HU-18 — detalle de producto, datos en vivo (disponibilidad). No prerenderizable.
    path: 'products/:id',
    renderMode: RenderMode.Client,
  },
  {
    // HU-16 — perfil propio del usuario autenticado. No prerenderizable.
    path: 'profile',
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
    // Vuelta desde Stripe con datos de la transacción en la URL. No prerenderizable.
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
    // HU-14 crit. 2 — "mis pedidos" por usuario, datos en vivo. No prerenderizable.
    path: 'my-orders',
    renderMode: RenderMode.Client,
  },
  {
    // HU-15 crit. 3 — lee ?token=&email= de la query string al construirse. No prerenderizable.
    path: 'reset-password',
    renderMode: RenderMode.Client,
  },
  {
    // HU-19 — conversación en vivo. No prerenderizable.
    path: 'chat',
    renderMode: RenderMode.Client,
  },
  {
    // HU-12 — pedidos pendientes de preparación, datos en vivo. No prerenderizable.
    path: 'despacho',
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
