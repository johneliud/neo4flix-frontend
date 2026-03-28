import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Movie, MovieService } from '../../../core/services/movie.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecommendationMovie, RecommendationService } from '../../../core/services/recommendation.service';
import { LazyImageComponent } from '../../../shared/components/lazy-image/lazy-image.component';
import { RatingComponent } from '../../../shared/components/rating/rating.component';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [RouterLink, LazyImageComponent, RatingComponent],
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly movie = signal<Movie | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly relatedMovies = signal<RecommendationMovie[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/']);
        return;
      }
      this.isLoading.set(true);
      this.hasError.set(false);
      this.relatedMovies.set([]);
      this.movieService
        .getMovieById(id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (movie) => {
            this.movie.set(movie);
            this.loadRelated(movie);
          },
          error: () => {
            this.hasError.set(true);
            this.notifications.error('Movie not found or unavailable.');
          },
        });
    });
  }

  private loadRelated(movie: Movie): void {
    const genre = movie.genres[0];
    if (!genre) return;
    this.recommendationService
      .getRecommendations(genre, null, null, 0, 12)
      .subscribe({
        next: (page) =>
          this.relatedMovies.set(page.content.filter((r) => r.id !== movie.id)),
      });
  }

  formattedRating(rating: number | null): string {
    if (rating === null || rating === undefined) return 'N/A';
    return rating.toFixed(1);
  }
}