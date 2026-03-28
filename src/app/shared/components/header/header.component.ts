import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly isMenuOpen = signal(false);
  readonly searchQuery = signal('');

  toggleMenu(): void {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  submitSearch(): void {
    const q = this.searchQuery().trim();
    this.router.navigate(['/search'], q ? { queryParams: { q } } : {});
    this.searchQuery.set('');
    this.closeMenu();
  }
}