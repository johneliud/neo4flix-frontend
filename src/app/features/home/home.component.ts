import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Movie, MovieService } from '../../core/services/movie.service';
import { NotificationService } from '../../core/services/notification.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { HeroCarouselComponent } from './hero-carousel.component';

const POOL_SIZE = 90;
const PAGE_SIZE = 15;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MovieCardComponent, PaginationComponent, HeroCarouselComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly notifications = inject(NotificationService);

  private pool: Movie[] = [];
  private weeklyStart = 0;

  readonly currentPage = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly pageSize = PAGE_SIZE;
  readonly skeletons = Array.from({ length: PAGE_SIZE });

  readonly totalElements = computed(() =>
    Math.min(this.pool.length - this.weeklyStart, this.pool.length),
  );

  readonly totalPages = computed(() =>
    Math.ceil(this.totalElements() / this.pageSize),
  );

  readonly movies = computed(() => {
    const start = this.weeklyStart + this.currentPage() * this.pageSize;
    return this.pool.slice(start, start + this.pageSize);
  });

  readonly pageRangeLabel = computed(() => {
    const start = this.currentPage() * this.pageSize + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize, this.totalElements());
    return `Showing ${start}–${end} of ${this.totalElements()}`;
  });

  ngOnInit(): void {
    this.movieService.getMovies(0, POOL_SIZE, 'averageRating', 'desc').subscribe({
      next: (response) => {
        this.pool = response.content;
        this.weeklyStart = this.computeWeeklyStart(this.pool.length);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.notifications.error('Failed to load movies. Please try again.');
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.pool = [];
    this.ngOnInit();
  }

  private computeWeeklyStart(poolSize: number): number {
    if (poolSize <= this.pageSize) return 0;
    const maxStart = poolSize - this.pageSize;
    return this.weekOfYear() % (maxStart + 1);
  }

  private weekOfYear(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  }
}