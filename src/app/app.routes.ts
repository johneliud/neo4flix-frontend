import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: '2fa',
    loadComponent: () =>
      import('./features/auth/two-factor/two-factor.component').then((m) => m.TwoFactorComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'movies/:id',
    loadComponent: () =>
      import('./features/movies/movie-detail/movie-detail.component').then(
        (m) => m.MovieDetailComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search.component').then((m) => m.SearchComponent),
    canActivate: [authGuard],
  },
  {
    path: 'recommendations',
    loadComponent: () =>
      import('./features/recommendations/recommendations.component').then(
        (m) => m.RecommendationsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'watchlist',
    loadComponent: () =>
      import('./features/watchlist/watchlist.component').then((m) => m.WatchlistComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
