import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Movie detail: client-side only (dynamic ID, can't prerender)
  { path: 'movies/:id', renderMode: RenderMode.Client },

  // Authenticated pages: SSR per-request
  { path: '', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },
  { path: 'recommendations', renderMode: RenderMode.Server },
  { path: 'watchlist', renderMode: RenderMode.Server },

  // Guest pages + 404: prerender at build time
  { path: '**', renderMode: RenderMode.Prerender },
];
