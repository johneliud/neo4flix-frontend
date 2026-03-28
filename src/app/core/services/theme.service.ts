import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = environment.storageKey;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isDark = signal(this.loadPreference());

  private loadPreference(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? stored === 'dark' : true;
  }

  /** Apply the current theme to the document. Call once on app init. */
  apply(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.classList.toggle('dark', this.isDark());
  }

  toggle(): void {
    this.isDark.update((v) => !v);
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.classList.toggle('dark', this.isDark());
    localStorage.setItem(STORAGE_KEY, this.isDark() ? 'dark' : 'light');
  }
}
