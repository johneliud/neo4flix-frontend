import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../core/services/movie.service';
import { LazyImageComponent } from '../lazy-image/lazy-image.component';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterLink, LazyImageComponent],
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent {
  readonly movie = input.required<Movie>();

  formattedRating(rating: number | null): string {
    if (rating === null || rating === undefined) return 'N/A';
    return rating.toFixed(1);
  }

  genreLabel(genres: string[]): string {
    return genres.slice(0, 2).join(' · ');
  }
}