import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { MovieService } from '../../core/services/movie.service';
import { RecommendationMovie, RecommendationService } from '../../core/services/recommendation.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [FormsModule, MovieCardComponent, PaginationComponent],
  templateUrl: './recommendations.component.html',
})
export class RecommendationsComponent implements OnInit, OnDestroy {
  private readonly recommendationService = inject(RecommendationService);
  private readonly movieService = inject(MovieService);
  private readonly destroy$ = new Subject<void>();

  readonly genre = signal('');
  readonly yearFrom = signal<number | null>(null);
  readonly yearTo = signal<number | null>(null);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly movies = signal<RecommendationMovie[]>([]);
  readonly genres = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);

  readonly minYear = 1990;
  readonly maxYear = new Date().getFullYear() + 10;
  readonly pageSize = 20;
  readonly skeletons = Array.from({ length: 20 });

  readonly pageRangeLabel = computed(() => {
    const start = this.currentPage() * this.pageSize + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize, this.totalElements());
    return `Showing ${start}–${end} of ${this.totalElements()}`;
  });

  ngOnInit(): void {
    this.movieService.getGenres().pipe(takeUntil(this.destroy$)).subscribe((g) => this.genres.set(g));
    this.load(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(): void {
    this.load(0);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.genre.set('');
    this.yearFrom.set(null);
    this.yearTo.set(null);
    this.load(0);
  }

  private load(page: number): void {
    this.isLoading.set(true);
    this.recommendationService
      .getRecommendations(this.genre(), this.yearFrom(), this.yearTo(), page, this.pageSize)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.movies.set(response.content);
          this.currentPage.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.hasLoaded.set(true);
        },
        error: () => {
          this.movies.set([]);
          this.hasLoaded.set(true);
        },
      });
  }
}