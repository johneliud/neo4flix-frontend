import { Component, inject, input, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { RatingService, RatingResponse } from '../../../core/services/rating.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [NgClass],
  templateUrl: './rating.component.html',
})
export class RatingComponent implements OnInit {
  private readonly ratingService = inject(RatingService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly movieId = input.required<string>();

  readonly stars = [1, 2, 3, 4, 5];
  readonly hovered = signal<number | null>(null);
  readonly userRating = signal<RatingResponse | null>(null);
  readonly isLoading = signal(false);

  ngOnInit(): void {
    this.ratingService.getByMovie(this.movieId()).subscribe({
      next: (ratings) => {
        const userId = this.authService.currentUserId();
        if (userId) {
          this.userRating.set(ratings.find((r) => r.userId === userId) ?? null);
        }
      },
    });
  }

  activeScore(): number {
    return this.hovered() ?? this.userRating()?.score ?? 0;
  }

  onStar(score: number): void {
    if (this.isLoading()) return;

    const current = this.userRating();

    if (current?.score === score) {
      this.removeRating(current.id);
      return;
    }

    if (current) {
      this.updateRating(current.id, score);
    } else {
      this.createRating(score);
    }
  }

  private createRating(score: number): void {
    this.isLoading.set(true);
    this.ratingService.create(this.movieId(), score).subscribe({
      next: (r) => {
        this.userRating.set(r);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.notifications.error(this.parseError(err));
        this.isLoading.set(false);
      },
    });
  }

  private updateRating(id: string, score: number): void {
    this.isLoading.set(true);
    this.ratingService.update(id, score).subscribe({
      next: (r) => {
        this.userRating.set(r);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.notifications.error(this.parseError(err));
        this.isLoading.set(false);
      },
    });
  }

  private removeRating(id: string): void {
    this.isLoading.set(true);
    this.ratingService.delete(id).subscribe({
      next: () => {
        this.userRating.set(null);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.notifications.error(this.parseError(err));
        this.isLoading.set(false);
      },
    });
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 403) return 'You must be logged in to rate movies.';
    if (err.status === 409) return 'You have already rated this movie.';
    if (err.status >= 500) return 'Something went wrong. Please try again.';
    return err.error?.message ?? 'An unexpected error occurred.';
  }
}