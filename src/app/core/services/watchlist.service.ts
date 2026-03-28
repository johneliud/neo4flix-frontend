import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface WatchlistItem {
  movieId: string;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly http = inject(HttpClient);

  readonly watchlistIds = signal<Set<string>>(new Set());
  private hasLoaded = false;

  /** Fires one API call to populate watchlistIds; subsequent calls are no-ops. */
  loadOnce(): void {
    if (this.hasLoaded) return;
    this.hasLoaded = true;
    this.http
      .get<WatchlistItem[]>('/api/users/profile/watchlist')
      .subscribe((items) => this.watchlistIds.set(new Set(items.map((i) => i.movieId))));
  }

  /** Full load — always fetches and returns items as an observable. */
  load(): Observable<WatchlistItem[]> {
    this.hasLoaded = true;
    return this.http.get<WatchlistItem[]>('/api/users/profile/watchlist').pipe(
      tap((items) => this.watchlistIds.set(new Set(items.map((i) => i.movieId)))),
    );
  }

  add(movieId: string): Observable<WatchlistItem> {
    return this.http
      .post<WatchlistItem>('/api/users/profile/watchlist', { movieId })
      .pipe(
        tap(() => {
          const ids = new Set(this.watchlistIds());
          ids.add(movieId);
          this.watchlistIds.set(ids);
        }),
      );
  }

  remove(movieId: string): Observable<void> {
    return this.http
      .delete<void>(`/api/users/profile/watchlist/${movieId}`)
      .pipe(
        tap(() => {
          const ids = new Set(this.watchlistIds());
          ids.delete(movieId);
          this.watchlistIds.set(ids);
        }),
      );
  }
}