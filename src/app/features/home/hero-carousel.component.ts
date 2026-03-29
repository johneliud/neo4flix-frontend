import { Component, PLATFORM_ID, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Movie, MovieService } from '../../core/services/movie.service';
import { HeroCardComponent } from '../../shared/components/hero-card/hero-card.component';

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
    this.movieService.getMovies(0, 8, 'averageRating', 'desc').subscribe({
      next: (response) => {
        this.movies.set(response.content.filter((m) => m.posterUrl));
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