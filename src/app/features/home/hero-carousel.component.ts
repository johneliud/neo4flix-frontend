import { Component, PLATFORM_ID, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Movie, MovieService } from '../../core/services/movie.service';
import { HeroCardComponent } from '../../shared/components/hero-card/hero-card.component';

const HERO_POOL_SIZE = 40;
const HERO_SLIDE_COUNT = 8;

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [HeroCardComponent],
  templateUrl: './hero-carousel.component.html',
  styleUrl: './hero-carousel.component.css',
})
export class HeroCarouselComponent implements OnInit, OnDestroy {
  private readonly movieService = inject(MovieService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly movies = signal<Movie[]>([]);
  readonly currentIndex = signal(0);
  readonly isLoading = signal(true);

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly INTERVAL = 5000;

  ngOnInit(): void {
    this.movieService.getMovies(0, HERO_POOL_SIZE, 'averageRating', 'desc').subscribe({
      next: (response) => {
        const pool = response.content.filter((m) => m.posterUrl);
        this.movies.set(this.dailySlice(pool));
        this.isLoading.set(false);
        this.startTimer();
      },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  next(): void {
    this.currentIndex.update((i) => (i + 1) % this.movies().length);
    this.resetTimer();
  }

  prev(): void {
    const len = this.movies().length;
    this.currentIndex.update((i) => (i - 1 + len) % len);
    this.resetTimer();
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.resetTimer();
  }

  pauseTimer(): void {
    this.stopTimer();
  }

  resumeTimer(): void {
    this.startTimer();
  }

  /**
   * Picks HERO_SLIDE_COUNT movies from the pool using the day-of-year as an
   * offset, so the featured selection rotates daily without any API change.
   */
  private dailySlice(pool: Movie[]): Movie[] {
    if (pool.length <= HERO_SLIDE_COUNT) return pool;
    const maxStart = pool.length - HERO_SLIDE_COUNT;
    const start = this.dayOfYear() % (maxStart + 1);
    return pool.slice(start, start + HERO_SLIDE_COUNT);
  }

  private dayOfYear(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  }

  private startTimer(): void {
    if (!isPlatformBrowser(this.platformId) || this.movies().length < 2) return;
    this.timer = setInterval(() => {
      this.currentIndex.update((i) => (i + 1) % this.movies().length);
    }, this.INTERVAL);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private resetTimer(): void {
    this.stopTimer();
    this.startTimer();
  }
}