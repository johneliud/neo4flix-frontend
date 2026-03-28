import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RatingResponse {
  id: string;
  userId: string;
  movieId: string;
  score: number;
  ratedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);

  getByMovie(movieId: string): Observable<RatingResponse[]> {
    return this.http.get<RatingResponse[]>(`/api/ratings/movie/${movieId}`);
  }

  create(movieId: string, score: number): Observable<RatingResponse> {
    return this.http.post<RatingResponse>('/api/ratings', { movieId, score });
  }

  update(ratingId: string, score: number): Observable<RatingResponse> {
    return this.http.put<RatingResponse>(`/api/ratings/${ratingId}`, score);
  }

  delete(ratingId: string): Observable<void> {
    return this.http.delete<void>(`/api/ratings/${ratingId}`);
  }
}