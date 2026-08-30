import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GirviService } from '../../../core/services/girvi.service';
import { GirviTransaction } from '../../../core/models/api-models';

@Component({
  selector: 'app-girvi-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6 gap-3">
        <h2 class="text-xl font-semibold text-brand-900">Girvi Transactions</h2>
        <a routerLink="/girvi/new" class="btn-primary shrink-0">+ New Girvi</a>
      </div>

      <select class="input-field w-full sm:w-56 mb-4" [ngModel]="statusFilter()" (ngModelChange)="onFilterChange($event)">
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="PARTIALLY_PAID">Partially Paid</option>
        <option value="OVERDUE">Overdue</option>
        <option value="CLOSED">Closed</option>
        <option value="REDEEMED">Redeemed</option>
        <option value="AUCTION_ELIGIBLE">Auction Eligible</option>
        <option value="AUCTIONED">Auctioned</option>
      </select>

      <div class="card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
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
                <tr class="border-t border-gray-100 hover:bg-brand-50" (click)="openTransaction(t.id)">
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
      </div>
    </div>
  `,
})
export class GirviListComponent implements OnInit {
  readonly transactions = signal<GirviTransaction[]>([]);
  readonly loading = signal(false);
  readonly statusFilter = signal('');

  constructor(
    private readonly girviService: GirviService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.load();
  }

  onFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.load();
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

  private load(): void {
    this.loading.set(true);
    this.girviService.list(this.statusFilter() || undefined).subscribe({
      next: (res) => {
        this.transactions.set(res.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}