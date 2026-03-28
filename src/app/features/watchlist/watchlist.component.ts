import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Movie, MovieService } from '../../core/services/movie.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { WatchlistService } from '../../core/services/watchlist.service';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [MovieCardComponent],
  templateUrl: './watchlist.component.html',
})
export class WatchlistComponent implements OnInit {
  private readonly watchlistService = inject(WatchlistService);
  private readonly movieService = inject(MovieService);

  readonly isLoading = signal(true);
  private readonly allMovies = signal<Movie[]>([]);

  /** Reactively filters to only movies still in the watchlist — updates when cards remove items. */
  readonly movies = computed(() =>
    this.allMovies().filter((m) => this.watchlistService.watchlistIds().has(m.id)),
  );

  readonly skeletons = Array.from({ length: 8 });

  ngOnInit(): void {
    this.watchlistService
      .load()
      .pipe(
        switchMap((items) => {
          if (items.length === 0) return of([]);
          return forkJoin(items.map((item) => this.movieService.getMovieById(item.movieId)));
        }),
      )
      .subscribe({
        next: (movies) => {
          this.allMovies.set(movies);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}