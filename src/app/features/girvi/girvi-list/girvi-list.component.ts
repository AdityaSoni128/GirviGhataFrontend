import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { GirviService } from '../../../core/services/girvi.service';
import { GirviTransaction } from '../../../core/models/api-models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-girvi-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PaginationComponent],
  template: `
    <div class="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <div class="flex items-center justify-between mb-6 gap-3 shrink-0">
        <h2 class="text-xl font-semibold text-brand-900">Girvi Transactions</h2>
        <a routerLink="/girvi/new" class="btn-primary shrink-0">+ New Girvi</a>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
        <input
          type="text"
          placeholder="Search by Girvi No., customer name, or mobile…"
          class="input-field flex-1"
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
        />
        <select class="input-field w-full sm:w-56" [ngModel]="statusFilter()" (ngModelChange)="onFilterChange($event)">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CLOSED">Closed</option>
          <option value="REDEEMED">Redeemed</option>
          <option value="AUCTION_ELIGIBLE">Auction Eligible</option>
          <option value="AUCTIONED">Auctioned</option>
        </select>
        <select class="input-field w-full sm:w-56" [ngModel]="sortBy()" (ngModelChange)="onSortChange($event)">
          <option value="createdAt">Newest first</option>
          <option value="pledgeDate">Pledge date</option>
          <option value="dueDate">Due date</option>
        </select>
      </div>

      <div class="card !p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div class="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table class="w-full text-sm">
            <thead class="bg-brand-50 text-left text-xs uppercase text-gray-500">
              <tr>
              <th class="px-3 sm:px-4 py-3">Customer</th>
              <th class="px-3 sm:px-4 py-3">Status</th>
              <th class="px-3 sm:px-4 py-3 whitespace-nowrap">Loan Amount</th>
              <th class="px-3 sm:px-4 py-3 whitespace-nowrap">Girvi No.</th>
              </tr>
            </thead>
            <tbody>
              @for (t of transactions(); track t.id) {
                <tr class="border-t border-gray-100 hover:bg-brand-50 cursor-pointer" (click)="openTransaction(t.id)">
                <td class="px-3 sm:px-4 py-3 max-w-[120px] sm:max-w-none truncate">{{ t.customer?.fullName || '—' }}</td>
                <td class="px-3 sm:px-4 py-3 whitespace-nowrap"><span class="badge" [class]="statusClass(t.status)">{{ t.status }}</span></td>
                <td class="px-3 sm:px-4 py-3 whitespace-nowrap">₹{{ t.valuation?.actualLoanAmount || '—' }}</td>
                <td class="px-3 sm:px-4 py-3 font-mono text-xs whitespace-nowrap">{{ t.girviNumber }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                    {{ loading() ? 'Loading…' : 'No transactions found.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <app-pagination
          class="shrink-0"
          [page]="page()"
          [pageSize]="pageSize()"
          [total]="total()"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      /* Same reasoning as CustomerListComponent: GirviListComponent
       * renders as <app-girvi-list>, a sibling of <router-outlet> inside
       * <main> (which is flex flex-col min-h-0). Without this, the host
       * tag has height:auto and every flex-1/min-h-0 class inside the
       * template above sizes against nothing. */
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class GirviListComponent implements OnInit {
  readonly transactions = signal<GirviTransaction[]>([]);
  readonly loading = signal(false);
  readonly statusFilter = signal('');
  readonly query = signal('');
  readonly sortBy = signal<'createdAt' | 'pledgeDate' | 'dueDate'>('createdAt');
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly total = signal(0);

  /** Raw keystrokes — debounced/deduped before triggering a fetch. */
  private readonly queryText$ = new Subject<string>();
  /** Fires exactly once per actual fetch: after a debounced search, or
   * immediately on filter/sort/page/page-size changes. */
  private readonly refresh$ = new Subject<void>();

  constructor(
    private readonly girviService: GirviService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.queryText$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => {
      this.query.set(q);
      this.page.set(1); // reset to page 1 on every new search
      this.refresh$.next();
    });

    this.refresh$
      .pipe(
        // switchMap cancels any in-flight request when a newer one fires,
        // so a slow response to an earlier search/filter/page can never
        // overwrite the results of a more recent one.
        switchMap(() => {
          this.loading.set(true);
          return this.girviService.list({
            status: this.statusFilter() || undefined,
            search: this.query() || undefined,
            page: this.page(),
            pageSize: this.pageSize(),
            sortBy: this.sortBy(),
          });
        }),
      )
      .subscribe({
        next: (res) => this.applyResult(res),
        error: () => this.loading.set(false),
      });

    this.refresh$.next();
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.queryText$.next(value);
  }

  onFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1); // reset to page 1 on filter change
    this.refresh$.next();
  }

  onSortChange(sortBy: 'createdAt' | 'pledgeDate' | 'dueDate'): void {
    this.sortBy.set(sortBy);
    this.page.set(1); // reset to page 1 on sort change
    this.refresh$.next();
  }

  onPageChange(next: number): void {
    this.page.set(next);
    this.refresh$.next();
  }

  onPageSizeChange(next: number): void {
    this.pageSize.set(next);
    this.page.set(1); // reset to page 1 on page-size change
    this.refresh$.next();
  }

  openTransaction(id: string): void {
    this.router.navigate(['/girvi', id]);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800';
      case 'REDEEMED':
      case 'CLOSED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-brand-100 text-brand-800';
    }
  }

  private applyResult(res: { results: GirviTransaction[]; total: number; page: number; pageSize: number }): void {
    this.transactions.set(res.results);
    this.total.set(res.total);
    this.page.set(res.page);
    this.pageSize.set(res.pageSize);
    this.loading.set(false);
  }
}