import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReportsService } from '../../../core/services/rates-reports.service';
import { DateOnlyPipe } from '../../../shared/pipes/date-only.pipe';

interface StatementRow {
  date: string;
  description: string;
  principal: string;
  interest: string;
  charges: string;
  payment: string;
  balance: string;
}

interface StatementResponse {
  customer: { fullName: string; customerCode: string };
  rows: StatementRow[];
}

@Component({
  selector: 'app-customer-statement',
  standalone: true,
  imports: [CommonModule, DateOnlyPipe],
  template: `
    @if (statement(); as s) {
      <div class="p-8 max-w-4xl mx-auto">
        <h2 class="text-xl font-semibold text-brand-900 mb-1">Statement — {{ s.customer.fullName }}</h2>
        <p class="text-sm text-gray-500 mb-6 font-mono">{{ s.customer.customerCode }}</p>

        <div class="card !p-0 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
            <thead class="bg-brand-50 text-center text-xs uppercase text-gray-500">
              <tr>
                <th class="px-4 py-2 whitespace-nowrap">Date</th>
                <th class="px-4 py-2 whitespace-nowrap">Description</th>
                <th class="px-4 py-2 whitespace-nowrap text-right">Principal</th>
                <th class="px-4 py-2 whitespace-nowrap text-right">Interest</th>
                <th class="px-4 py-2 whitespace-nowrap text-right">Payment</th>
                <th class="px-4 py-2 whitespace-nowrap text-right">Balance</th>
              </tr>
            </thead>
            <tbody class="text-center">
              @for (row of s.rows; track $index) {
                <tr class="border-t border-gray-100">
                  <td class="px-4 py-2 whitespace-nowrap">{{ row.date | dateOnly}}</td>
                  <td class="px-4 py-2 whitespace-nowrap">{{ row.description }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-right">{{ row.principal !== '0' ? '₹' + row.principal : '—' }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-right">{{ row.interest !== '0' ? '₹' + row.interest : '—' }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-right">{{ row.payment !== '0' ? '₹' + row.payment : '—' }}</td>
                  <td class="px-4 py-2 whitespace-nowrap text-right font-medium">₹{{ row.balance }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">No activity yet.</td></tr>
              }
            </tbody>
          </table>
          </div>
        </div>
      </div>
    } @else if (loading()) {
      <p class="p-8 text-gray-500">Loading statement…</p>
    }
  `,
})
export class CustomerStatementComponent implements OnInit {
  readonly statement = signal<StatementResponse | null>(null);
  readonly loading = signal(true);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly reportsService: ReportsService,
  ) { }

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('customerId')!;
    this.reportsService.customerStatement(customerId).subscribe({
      next: (res) => {
        this.statement.set(res as StatementResponse);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
