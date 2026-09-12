import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/api-models';
import { AuthService } from '../../../core/services/auth.service';
import { DateOnlyPipe } from '../../../shared/pipes/date-only.pipe';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DateOnlyPipe],
  template: `
    @if (customer(); as c) {
      <div class="p-8 max-w-4xl mx-auto">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-brand-900">{{ c.fullName }}</h2>
            <p class="text-sm text-gray-500 font-mono">{{ c.customerCode }}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="flex gap-2">
              @if (canEdit) {
                <a [routerLink]="['/customers', c.id, 'edit']" class="btn-secondary">
                  Edit
                </a>
              }
              <a [routerLink]="['/girvi/new']" [queryParams]="{ customerId: c.id }" class="btn-primary">
                + New Girvi for this customer
              </a>
            </div>
            <a [routerLink]="['/reports/customer-statement', c.id]" class="text-sm text-brand-700 hover:underline">
              View Statement
            </a>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="card">
            <h3 class="text-sm font-semibold text-gray-600 mb-3">Contact</h3>
            <dl class="text-sm space-y-1">
              <div class="flex justify-between"><dt class="text-gray-500">Mobile</dt><dd>{{ c.mobile }}</dd></div>
              @if (c.guardianName) {
                <div class="flex justify-between"><dt class="text-gray-500">Guardian</dt><dd>{{ c.guardianName }}</dd></div>
              }
              @if (c.city) {
                <div class="flex justify-between"><dt class="text-gray-500">City</dt><dd>{{ c.city }}, {{ c.state }}</dd></div>
              }
            </dl>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-600">KYC</h3>
              @if (canViewFullKyc && !unmasked()) {
                <button (click)="unmaskKyc()" class="text-xs text-brand-700 hover:underline">Unmask (audited)</button>
              }
            </div>
            @if (c.kyc) {
              <dl class="text-sm space-y-1">
                <div class="flex justify-between">
                  <dt class="text-gray-500">Aadhaar</dt>
                  <dd class="font-mono">{{ c.kyc.aadhaarFull || c.kyc.aadhaarMasked || '—' }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-gray-500">PAN</dt>
                  <dd class="font-mono">{{ c.kyc.panNumber || '—' }}</dd>
                </div>
              </dl>
            } @else {
              <p class="text-sm text-gray-400">No KYC on file.</p>
            }
          </div>
        </div>

        <div class="card !p-0 overflow-hidden">
          <h3 class="text-sm font-semibold text-gray-600 px-4 pt-4 pb-2">Girvi Transactions</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-brand-50 text-center text-xs uppercase text-gray-500">                <tr>
                  <th class="px-4 py-2 whitespace-nowrap">Girvi No.</th>
                  <th class="px-4 py-2 whitespace-nowrap">Status</th>
                  <th class="px-4 py-2 whitespace-nowrap">Pledge Date</th>
                  <th class="px-4 py-2 whitespace-nowrap">Loan Amount</th>
                  <th class="px-4 py-2 whitespace-nowrap">Total Paid</th>
                </tr>
              </thead>
              <tbody class="text-center">
                @for (t of c.transactions; track t.girviNumber) {
                  <tr class="border-t border-gray-100" (click)="openTransaction(t.id)">
                    <td class="px-4 py-2 whitespace-nowrap font-mono text-xs">{{ t.girviNumber }}</td>
                    <td class="px-4 py-2 whitespace-nowrap">
                      <span class="badge" [class]="statusClass(t.status)">{{ t.status }}</span>
                    </td>
                    <td class="px-4 py-2 whitespace-nowrap">{{ t.pledgeDate | dateOnly }}</td>
                    <td class="px-4 py-2 whitespace-nowrap">₹{{ t.loanAmount }}</td>
                    <td class="px-4 py-2 whitespace-nowrap">₹{{ t.totalPaid | number: '1.0-2' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="px-4 py-6 text-center text-gray-400">No transactions yet.</td></tr>
                }
              </tbody>
          </table>
          </div>
        </div>
      </div>
    } @else if (loading()) {
      <p class="p-8 text-gray-500">Loading customer…</p>
    } @else {
      <p class="p-8 text-red-600">Customer not found.</p>
    }
  `,
})
export class CustomerDetailComponent implements OnInit {
  readonly customer = signal<Customer | null>(null);
  readonly loading = signal(true);
  readonly unmasked = signal(false);
  readonly canViewFullKyc: boolean;
  readonly canEdit: boolean;

  private customerId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly customersService: CustomersService,
    auth: AuthService,
    private readonly router: Router
  ) {
    this.canViewFullKyc = auth.hasPermission('kyc:view_full');
    this.canEdit = auth.hasPermission('customer:edit');
  }

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id')!;
    this.load(false);
  }

  unmaskKyc(): void {
    this.unmasked.set(true);
    this.load(true);
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

  private load(unmaskKyc: boolean): void {
    this.loading.set(true);
    this.customersService.getById(this.customerId, unmaskKyc).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
