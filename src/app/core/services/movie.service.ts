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

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly http = inject(HttpClient);

  private readonly pageCache = new Map<string, PagedResponse<Movie>>();
  private readonly detailCache = new Map<string, Movie>();
  private readonly searchCache = new Map<string, PagedResponse<Movie>>();
  private genresCache: string[] | null = null;

  getMovies(
    page = 0,
    size = 20,
    sort = 'title',
    direction = 'asc',
  ): Observable<PagedResponse<Movie>> {
    const key = `${page}-${size}-${sort}-${direction}`;
    const cached = this.pageCache.get(key);
    if (cached) return of(cached);

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('direction', direction);
    return this.http
      .get<PagedResponse<Movie>>('/api/movies', { params })
      .pipe(tap((response) => this.pageCache.set(key, response)));
  }

  getMovieById(id: string): Observable<Movie> {
    const cached = this.detailCache.get(id);
    if (cached) return of(cached);

    return this.http
      .get<Movie>(`/api/movies/${id}`)
      .pipe(tap((movie) => this.detailCache.set(id, movie)));
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
    const cached = this.searchCache.get(key);
    if (cached) return of(cached);

    return this.http
      .get<PagedResponse<Movie>>('/api/movies/search', { params })
      .pipe(tap((response) => this.searchCache.set(key, response)));
  }

  getGenres(): Observable<string[]> {
    if (this.genresCache) return of(this.genresCache);
    return this.http
      .get<string[]>('/api/movies/genres')
      .pipe(tap((genres) => (this.genresCache = genres)));
  }
}