import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Movie, MovieService, PagedResponse } from '../../core/services/movie.service';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, MovieCardComponent, PaginationComponent],
  templateUrl: './search.component.html',
})
export class SearchComponent implements OnInit {
  private readonly movieService = inject(MovieService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly titleChange$ = new Subject<string>();

  readonly title = signal('');
  readonly genre = signal('');
  readonly yearFrom = signal<number | null>(null);
  readonly yearTo = signal<number | null>(null);
  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly movies = signal<Movie[]>([]);
  readonly genres = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly hasSearched = signal(false);

  readonly pageSize = 15;
  readonly skeletons = Array.from({ length: 15 });

  readonly pageRangeLabel = computed(() => {
    const start = this.currentPage() * this.pageSize + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize, this.totalElements());
    return `Showing ${start}–${end} of ${this.totalElements()}`;
  });

  ngOnInit(): void {
    this.movieService.getGenres().subscribe((g) => this.genres.set(g));

    this.titleChange$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.search(0));

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.title.set(params['q'] ?? '');
      this.genre.set(params['genre'] ?? '');
      this.yearFrom.set(params['yearFrom'] ? Number(params['yearFrom']) : null);
      this.yearTo.set(params['yearTo'] ? Number(params['yearTo']) : null);
      if (this.title() || this.genre() || this.yearFrom() || this.yearTo()) {
        this.search(Number(params['page'] ?? 0));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTitleChange(value: string): void {
    this.title.set(value);
    this.titleChange$.next(value);
  }

  onFilterChange(): void {
    this.search(0);
  }

  onPageChange(page: number): void {
    this.search(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  search(page: number): void {
    this.syncQueryParams(page);
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.movieService
      .searchMovies(this.title(), this.genre(), this.yearFrom(), this.yearTo(), page, this.pageSize)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: PagedResponse<Movie>) => {
          this.movies.set(response.content);
          this.currentPage.set(response.page);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: () => this.movies.set([]),
      });
  }

  clearFilters(): void {
    this.title.set('');
    this.genre.set('');
    this.yearFrom.set(null);
    this.yearTo.set(null);
    this.movies.set([]);
    this.hasSearched.set(false);
    this.router.navigate(['/search']);
  }

  private syncQueryParams(page: number): void {
    const queryParams: Record<string, string | number> = {};
    if (this.title()) queryParams['q'] = this.title();
    if (this.genre()) queryParams['genre'] = this.genre();
    if (this.yearFrom() != null) queryParams['yearFrom'] = this.yearFrom()!;
    if (this.yearTo() != null) queryParams['yearTo'] = this.yearTo()!;
    if (page > 0) queryParams['page'] = page;
    this.router.navigate(['/search'], { queryParams, replaceUrl: true });
  }
}