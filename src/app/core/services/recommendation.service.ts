import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecommendationMovie {
  id: string;
  title: string;
  genres: string[];
  releaseYear: number;
  description: string;
  posterUrl: string | null;
  averageRating: number | null;
  relevanceScore: number;
}

export interface PagedRecommendations {
  content: RecommendationMovie[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly http = inject(HttpClient);

  getRecommendations(
    genre: string,
    yearFrom: number | null,
    yearTo: number | null,
    page = 0,
    size = 20,
  ): Observable<PagedRecommendations> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (genre) params = params.set('genre', genre);
    if (yearFrom != null) params = params.set('yearFrom', yearFrom);
    if (yearTo != null) params = params.set('yearTo', yearTo);

    return this.http.get<PagedRecommendations>('/api/recommendations', { params });
  }
}