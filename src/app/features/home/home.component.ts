import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Movie, MovieService } from '../../core/services/movie.service';
import { NotificationService } from '../../core/services/notification.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MovieCardComponent, PaginationComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly notifications = inject(NotificationService);

  readonly movies = signal<Movie[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly pageSize = 20;
  readonly skeletons = Array.from({ length: 20 });

  ngOnInit(): void {
    this.loadMovies(0);
  }

  loadMovies(page: number): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.movieService
      .getMovies(page, this.pageSize)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.movies.set(response.content);
          this.currentPage.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.hasError.set(true);
          this.notifications.error('Failed to load movies. Please try again.');
        },
      });
  }

  onPageChange(page: number): void {
    this.loadMovies(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}