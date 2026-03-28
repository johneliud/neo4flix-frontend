import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  templateUrl: './lazy-image.component.html',
  host: { class: 'block relative h-full w-full overflow-hidden' },
})
export class LazyImageComponent {
  readonly src = input.required<string>();
  readonly alt = input.required<string>();

  readonly fullLoaded = signal(false);

  readonly thumbnailSrc = computed(() => {
    const url = this.src();
    return url.includes('/w500/') ? url.replace('/w500/', '/w92/') : url;
  });

  onFullLoad(): void {
    this.fullLoaded.set(true);
  }
}