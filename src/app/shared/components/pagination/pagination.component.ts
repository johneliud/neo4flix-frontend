import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  /** 0-based current page */
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  readonly pages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 1) return [];

    const delta = 2;
    const start = Math.max(0, current - delta);
    const end = Math.min(total - 1, current + delta);
    const result: (number | null)[] = [];

    if (start > 0) {
      result.push(0);
      if (start > 1) result.push(null);
    }
    for (let i = start; i <= end; i++) result.push(i);
    if (end < total - 1) {
      if (end < total - 2) result.push(null);
      result.push(total - 1);
    }
    return result;
  });

  goTo(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}