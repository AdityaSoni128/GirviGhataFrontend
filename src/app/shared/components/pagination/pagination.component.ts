import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Reusable pagination bar: page/total-pages label, prev/next buttons, and a
 * page-size selector. Every list screen (Customers, Girvi, …) shares this
 * one component instead of duplicating pagination markup/logic.
 *
 * The component is display-only — it emits page/pageSize change events and
 * lets the parent screen own the actual data fetch (so each screen keeps
 * full control over resetting to page 1 on search/filter/sort changes).
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 border-t border-gray-100 text-sm">
      <div class="text-gray-500">
        @if (total === 0) {
          No results
        } @else {
          Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ total }}
        }
      </div>

      <div class="flex items-center gap-3">
        <select
          class="input-field !w-auto !py-1"
          [ngModel]="pageSize"
          (ngModelChange)="onPageSizeChange($event)"
        >
          @for (size of pageSizeOptions; track size) {
            <option [value]="size">{{ size }} / page</option>
          }
        </select>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="btn-secondary !px-3 !py-1"
            [disabled]="page <= 1"
            (click)="onPageChange(page - 1)"
          >
            Prev
          </button>
          <span class="px-2 text-gray-600 whitespace-nowrap">Page {{ page }} of {{ totalPages() }}</span>
          <button
            type="button"
            class="btn-secondary !px-3 !py-1"
            [disabled]="page >= totalPages()"
            (click)="onPageChange(page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() total = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  rangeStart(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  onPageChange(next: number): void {
    if (next < 1 || next > this.totalPages()) return;
    this.pageChange.emit(next);
  }

  onPageSizeChange(next: number): void {
    this.pageSizeChange.emit(Number(next));
  }
}
