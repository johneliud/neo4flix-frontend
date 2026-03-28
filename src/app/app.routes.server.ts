import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Movie detail: client-side only (dynamic ID, can't prerender)
  { path: 'movies/:id', renderMode: RenderMode.Client },

  // Authenticated pages: client-side only (require auth context unavailable at SSR)
  { path: 'recommendations', renderMode: RenderMode.Client },
  { path: 'watchlist', renderMode: RenderMode.Client },

  // Public pages: SSR per-request
  { path: '', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },

  // Auth modals: prerender (static forms, no server data needed)
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: '2fa', renderMode: RenderMode.Prerender },

  // 404: prerender at build time
  { path: '**', renderMode: RenderMode.Prerender },
];
