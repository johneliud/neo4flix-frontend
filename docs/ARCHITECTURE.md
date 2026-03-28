# Neo4flix Frontend — Architecture

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Angular 21 (standalone components) |
| SSR | Angular SSR + Express 5 |
| Styling | Tailwind CSS v4 |
| HTTP | `HttpClient` with functional interceptors |
| State | Angular Signals (`signal`, `computed`, `input`, `output`) |
| Forms | Reactive Forms (`FormBuilder`) |
| Routing | Lazy-loaded standalone components |
| 2FA QR | `qrcode` (CommonJS, allowed via `angular.json`) |

---

## Project Structure

```
src/
├── environments/
│   ├── environment.ts                   # apiUrl: 'http://localhost:8081'
│   └── environment.production.ts        # apiUrl: '' (relative, proxy resolves)
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts            # Redirect to /login if not authenticated
│   │   │   └── guest.guard.ts           # Redirect to / if already authenticated
│   │   ├── interceptors/
│   │   │   ├── base-url.interceptor.ts  # Prepend apiUrl to /api/* requests
│   │   │   └── auth.interceptor.ts      # Attach Authorization: Bearer <token>
│   │   └── services/
│   │       ├── auth.service.ts          # JWT management, isAuthenticated, currentUserId
│   │       ├── movie.service.ts         # Movie CRUD + in-memory session cache
│   │       ├── rating.service.ts        # Rating CRUD
│   │       ├── user.service.ts          # Profile, 2FA setup/verify/disable
│   │       ├── notification.service.ts  # Toast notifications
│   │       ├── theme.service.ts         # Dark/light mode toggle
│   │       └── two-factor-setup.service.ts  # Bridge: passes QR state to TwoFactorComponent
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/                   # Login form (modal overlay, guestGuard)
│   │   │   ├── register/                # Register form (modal overlay, guestGuard)
│   │   │   └── two-factor/              # TOTP verification — dual mode: login | setup
│   │   ├── home/                        # Paginated movie grid
│   │   ├── movies/
│   │   │   └── movie-detail/            # Full movie info + star rating widget
│   │   ├── search/                      # Debounced title/genre/year filter + URL sync
│   │   ├── settings/                    # Account info + 2FA toggle
│   │   ├── recommendations/             # Stub — backend not yet implemented
│   │   └── watchlist/                   # Stub — backend not yet implemented
│   ├── layouts/
│   │   └── main-layout/                 # Shell with header; all routes rendered as children
│   ├── shared/
│   │   └── components/
│   │       ├── header/                  # Nav, search bar, theme toggle, auth actions
│   │       ├── lazy-image/              # LQIP blur-up: w92 thumbnail → w500 full-res
│   │       ├── movie-card/              # Poster, title, genres, average rating chip
│   │       ├── notification/            # Toast stack (success/error)
│   │       ├── pagination/              # Prev/next/number page buttons
│   │       └── rating/                  # Interactive 5-star selector (create/update/delete)
│   ├── not-found/                       # 404 page
│   ├── app.ts                           # Root component — <router-outlet />
│   ├── app.config.ts                    # Providers: router, HttpClient + interceptors, hydration
│   ├── app.routes.ts                    # All application routes (lazy-loaded)
│   └── app.routes.server.ts             # SSR render modes per route
```

---

## Routing

All routes are children of `MainLayoutComponent` (provides the header shell), except `**` (404).

| Path | Component | Guard | SSR Mode |
|------|-----------|-------|----------|
| `/` | `HomeComponent` | — | `Server` |
| `/login` | `LoginComponent` | `guestGuard` | `Prerender` |
| `/register` | `RegisterComponent` | `guestGuard` | `Prerender` |
| `/2fa` | `TwoFactorComponent` | `guestGuard` | `Prerender` |
| `/search` | `SearchComponent` | — | `Client` |
| `/movies/:id` | `MovieDetailComponent` | `authGuard` | `Client` |
| `/recommendations` | `RecommendationsComponent` | `authGuard` | `Client` |
| `/watchlist` | `WatchlistComponent` | `authGuard` | `Client` |
| `/settings` | `SettingsComponent` | `authGuard` | `Client` |
| `**` | `NotFoundComponent` | — | `Prerender` |

Auth modals (`/login`, `/register`, `/2fa`) render as fixed overlays on top of the home page content — not as full-page replacements.

---

## Services

### `AuthService`

Manages JWT lifecycle using Angular Signals. Tokens are stored in `localStorage` (guarded with `isPlatformBrowser` for SSR).

| Member | Type | Description |
|--------|------|-------------|
| `isAuthenticated` | `Signal<boolean>` | Derived from presence of access token |
| `currentUserId` | `Signal<string \| null>` | Decoded from JWT `sub` claim (base64) |
| `login(body)` | `Observable<LoginResponse>` | `POST /api/auth/login` |
| `register(body)` | `Observable<AuthResponse>` | `POST /api/auth/register` |
| `verifyMfa(body)` | `Observable<AuthResponse>` | `POST /api/auth/2fa/authenticate` |
| `refreshToken(body)` | `Observable<AuthResponse>` | `POST /api/auth/refresh` |
| `logout()` | `void` | Clears tokens, navigates to `/login` |

`LoginResponse` is a discriminated union: `AuthResponse` (login succeeded) or `MfaRequiredResponse` (must complete TOTP).

### `MovieService`

All GET responses are cached in-memory for the session lifetime.

| Method | Cache key | Endpoint |
|--------|-----------|----------|
| `getMovies(page, size, sort, direction)` | `"page-size-sort-dir"` | `GET /api/movies` |
| `getMovieById(id)` | movie ID | `GET /api/movies/:id` |
| `searchMovies(title, genre, yearFrom, yearTo, page, size)` | serialised `HttpParams` | `GET /api/movies/search` |
| `getGenres()` | single array | `GET /api/movies/genres` |

### `RatingService`

No caching — ratings are mutable.

| Method | Endpoint |
|--------|----------|
| `getByMovie(movieId)` | `GET /api/ratings/movie/:movieId` |
| `create(movieId, score)` | `POST /api/ratings` |
| `update(ratingId, score)` | `PUT /api/ratings/:id` |
| `delete(ratingId)` | `DELETE /api/ratings/:id` |

### `UserService`

| Method | Endpoint |
|--------|----------|
| `getProfile()` | `GET /api/users/profile` |
| `setup2FA()` | `POST /api/auth/2fa/setup` |
| `verify2FA(totpCode)` | `POST /api/auth/2fa/verify` |
| `disable2FA(password)` | `POST /api/auth/2fa/disable` |

### `TwoFactorSetupService`

Signal bridge between `SettingsComponent` and `TwoFactorComponent`.

```
SettingsComponent  →  setupService.setup.set(response)   // after setup2FA() call
TwoFactorComponent →  setupService.setup()               // reads QR data to render
                   →  setupService.clear()               // on verify success or cancel
```

---

## Shared Components

### `LazyImageComponent`

LQIP (Low Quality Image Placeholder) blur-up for TMDB posters.

- **Thumbnail** (`w92`): immediately visible, blurred and scaled
- **Shimmer**: `animate-pulse` overlay fades out once full image loads
- **Full-res** (`w500`): fades in on `(load)`, scales slightly on hover

The thumbnail URL is derived automatically by replacing `/w500/` with `/w92/` in the `src` input. Falls back gracefully for non-TMDB URLs.

```html
<app-lazy-image [src]="movie.posterUrl" [alt]="movie.title" />
```

### `RatingComponent`

Interactive 5-star selector embedded in `MovieDetailComponent`.

- Fetches all ratings for the movie on init; finds the one matching `currentUserId`
- Hover highlights stars up to the cursor position
- Click same score → removes rating (`DELETE`)
- Click different score → creates (`POST`) or updates (`PUT`) rating
- Disabled while a request is in flight

```html
<app-rating [movieId]="movie.id" />
```

### `MovieCardComponent`

Displays poster (via `LazyImageComponent`), title, genres, and average rating. Used on the home grid and search results.

### `PaginationComponent`

Page navigation. Inputs: `currentPage`, `totalPages`. Output: `pageChange`.

### `HeaderComponent`

- Desktop search bar (widens on focus, submits on Enter → `/search?title=...`)
- Mobile search icon → navigates to `/search`
- Dark/light theme toggle
- Settings gear icon when authenticated
- Username + logout when authenticated; login/register links otherwise

---

## Two-Factor Authentication

### Login flow

```
POST /api/auth/login
  ├── AuthResponse        → tokens saved, navigate to /
  └── MfaRequiredResponse → mfaToken saved, navigate to /2fa
                            TwoFactorComponent (mode='login')
                            POST /api/auth/2fa/authenticate → tokens saved, navigate to /
```

### Setup flow (Settings page)

```
SettingsComponent.beginSetup()
  → POST /api/auth/2fa/setup
  → TwoFactorSetupService.setup.set(response)
  → step = 'setup' → renders <app-two-factor mode="setup">
      → shows QR code + manual secret
      → POST /api/auth/2fa/verify
      → emits (verified) on success or cancel
  ← onSetupVerified(): if setupService.setup() is null → show success notification
```

### Disable flow

```
SettingsComponent.beginDisable()
  → user enters password
  → POST /api/auth/2fa/disable → profile.twoFactorEnabled = false
```

---

## Design System

All styling uses Tailwind utilities and CSS custom properties from `styles.css`. Do not add new color values, gradients, or shadow definitions.

### Color tokens

| Token | Usage |
|-------|-------|
| `var(--bright-blue)` | Primary actions, focus rings, login accent |
| `var(--french-violet)` | Settings/2FA accent, star fills |
| `var(--gray-900)` | Primary text |
| `var(--gray-700)` | Secondary text, labels |

### Conventions

- Focus rings: `focus-visible:ring-2 focus-visible:ring-[var(--bright-blue)]`
- Disabled state: `disabled:opacity-50 disabled:cursor-not-allowed`
- Color transitions: `transition-colors duration-150`
- Image fades: `transition-opacity duration-500`
- No hardcoded hex values, no gradients, no emoji in UI

---

## Interceptors

**`base-url.interceptor.ts`** — prepends `environment.apiUrl` to any request whose URL starts with `/api`.

**`auth.interceptor.ts`** — attaches `Authorization: Bearer <token>` when a token exists and the request targets `/api`.

Registered in `app.config.ts`:
```typescript
provideHttpClient(withFetch(), withInterceptors([baseUrlInterceptor, authInterceptor]))
```

---

## SSR Notes

- `withFetch()` is required — Angular 21 SSR uses the Fetch API on the server side.
- All `localStorage` access is guarded with `isPlatformBrowser(platformId)`.
- Auth-protected routes use `RenderMode.Client` to avoid server-side redirect loops.
- Auth modal routes are prerendered — they are static forms with no server-side data dependency.