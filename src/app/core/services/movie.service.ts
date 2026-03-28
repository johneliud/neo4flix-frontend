import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  getMovies(
    page = 0,
    size = 20,
    sort = 'title',
    direction = 'asc',
  ): Observable<PagedResponse<Movie>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('direction', direction);
    return this.http.get<PagedResponse<Movie>>('/api/movies', { params });
  }

  getMovieById(id: string): Observable<Movie> {
    return this.http.get<Movie>(`/api/movies/${id}`);
  }
}