import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { Movie } from '../../../core/services/movie.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { LazyImageComponent } from '../lazy-image/lazy-image.component';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterLink, LazyImageComponent],
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent implements OnInit {
  private readonly watchlistService = inject(WatchlistService);
  private readonly notifications = inject(NotificationService);

  readonly movie = input.required<Movie>();

  readonly inWatchlist = computed(() =>
    this.watchlistService.watchlistIds().has(this.movie().id),
  );
  readonly isWatchlistLoading = signal(false);

  ngOnInit(): void {
    this.watchlistService.loadOnce();
  }

  onToggleWatchlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isWatchlistLoading()) return;

    this.isWatchlistLoading.set(true);
    const movieId = this.movie().id;
    const action: Observable<unknown> = this.inWatchlist()
      ? this.watchlistService.remove(movieId)
      : this.watchlistService.add(movieId);

    action.pipe(finalize(() => this.isWatchlistLoading.set(false))).subscribe({
      error: () => this.notifications.error('Could not update watchlist.'),
    });
  }

  formattedRating(rating: number | null): string {
    if (rating === null || rating === undefined) return 'N/A';
    return rating.toFixed(1);
  }

  genreLabel(genres: string[]): string {
    return genres.slice(0, 2).join(' · ');
  }
}