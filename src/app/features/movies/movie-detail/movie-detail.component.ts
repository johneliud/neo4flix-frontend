import { Component, OnInit, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { Movie, MovieService } from '../../../core/services/movie.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecommendationMovie, RecommendationService } from '../../../core/services/recommendation.service';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { LazyImageComponent } from '../../../shared/components/lazy-image/lazy-image.component';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { RatingComponent } from '../../../shared/components/rating/rating.component';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [RouterLink, LazyImageComponent, MovieCardComponent, RatingComponent],
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly watchlistService = inject(WatchlistService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly movie = signal<Movie | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly relatedMovies = signal<RecommendationMovie[]>([]);
  readonly isWatchlistLoading = signal(false);

  readonly inWatchlist = computed(() => {
    const m = this.movie();
    return m ? this.watchlistService.watchlistIds().has(m.id) : false;
  });

  ngOnInit(): void {
    this.watchlistService.loadOnce();
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

  onToggleWatchlist(): void {
    if (this.isWatchlistLoading()) return;
    const movieId = this.movie()!.id;
    this.isWatchlistLoading.set(true);
    const action: Observable<unknown> = this.inWatchlist()
      ? this.watchlistService.remove(movieId)
      : this.watchlistService.add(movieId);

    action.pipe(finalize(() => this.isWatchlistLoading.set(false))).subscribe({
      error: () => this.notifications.error('Could not update watchlist.'),
    });
  }

  onShare(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.notifications.success('Link copied!');
    });
  }

  private loadRelated(movie: Movie): void {
    const genre = movie.genres[0];
    if (!genre) return;
    this.recommendationService.getRecommendations(genre, null, null, 0, 12).subscribe({
      next: (page) =>
        this.relatedMovies.set(page.content.filter((r) => r.id !== movie.id)),
    });
  }

  formattedRating(rating: number | null): string {
    if (rating === null || rating === undefined) return 'N/A';
    return rating.toFixed(1);
  }
}