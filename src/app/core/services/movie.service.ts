import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

export interface Movie {
  id: string;
  title: string;
  genres: string[];
  releaseYear: number;
  description: string;
  posterUrl: string | null;
  averageRating: number | null;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

const DAY_MS  = 24 * 60 * 60 * 1000;
const WEEK_MS =  7 * DAY_MS;

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly http = inject(HttpClient);

  private readonly pageCache   = new Map<string, CacheEntry<PagedResponse<Movie>>>();
  private readonly detailCache = new Map<string, CacheEntry<Movie>>();
  private readonly searchCache = new Map<string, CacheEntry<PagedResponse<Movie>>>();
  private genresCacheEntry: CacheEntry<string[]> | null = null;

  getMovies(
    page = 0,
    size = 20,
    sort = 'title',
    direction = 'asc',
  ): Observable<PagedResponse<Movie>> {
    const key = `${page}-${size}-${sort}-${direction}`;
    const entry = this.pageCache.get(key);
    if (entry && Date.now() - entry.cachedAt < WEEK_MS) return of(entry.data);

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('direction', direction);
    return this.http
      .get<PagedResponse<Movie>>('/api/movies', { params })
      .pipe(tap((data) => this.pageCache.set(key, { data, cachedAt: Date.now() })));
  }

  getMovieById(id: string): Observable<Movie> {
    const entry = this.detailCache.get(id);
    if (entry && Date.now() - entry.cachedAt < WEEK_MS) return of(entry.data);

    return this.http
      .get<Movie>(`/api/movies/${id}`)
      .pipe(tap((data) => this.detailCache.set(id, { data, cachedAt: Date.now() })));
  }

  searchMovies(
    title: string,
    genre: string,
    yearFrom: number | null,
    yearTo: number | null,
    page = 0,
    size = 15,
  ): Observable<PagedResponse<Movie>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (title) params = params.set('title', title);
    if (genre) params = params.set('genre', genre);
    if (yearFrom != null) params = params.set('releaseYearFrom', yearFrom);
    if (yearTo != null) params = params.set('releaseYearTo', yearTo);

    const key = params.toString();
    const entry = this.searchCache.get(key);
    if (entry && Date.now() - entry.cachedAt < WEEK_MS) return of(entry.data);

    return this.http
      .get<PagedResponse<Movie>>('/api/movies/search', { params })
      .pipe(tap((data) => this.searchCache.set(key, { data, cachedAt: Date.now() })));
  }

  getGenres(): Observable<string[]> {
    if (this.genresCacheEntry && Date.now() - this.genresCacheEntry.cachedAt < WEEK_MS) {
      return of(this.genresCacheEntry.data);
    }
    return this.http
      .get<string[]>('/api/movies/genres')
      .pipe(tap((data) => (this.genresCacheEntry = { data, cachedAt: Date.now() })));
  }
}
