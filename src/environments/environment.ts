// Production build default. Swapped for environment.development.ts in dev builds
// via angular.json fileReplacements. Same origin-scheme as dev here because this
// project runs single-host (docker-compose maps both services onto localhost) —
// point this at your real backend origin before deploying elsewhere.
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:5244/api',
};
