import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/api-models';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex items-center justify-between mb-6 gap-3">
        <h2 class="text-xl font-semibold text-brand-900">Customers</h2>
        <a routerLink="/customers/new" class="btn-primary shrink-0">+ New Customer</a>
      </div>

      <input
        type="text"
        placeholder="Search by name, mobile, customer code, Aadhaar last-4, or PAN…"
        class="input-field mb-4"
        [ngModel]="query()"
        (ngModelChange)="onQueryChange($event)"
      />

      <div class="card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-brand-50 text-left text-xs uppercase text-gray-500">
              <tr>
              <th class="px-3 sm:px-4 py-3">Name</th>
              <th class="px-3 sm:px-4 py-3 whitespace-nowrap">Mobile</th>
              <th class="px-3 sm:px-4 py-3 whitespace-nowrap">City</th>
              <th class="px-3 sm:px-4 py-3 whitespace-nowrap">Code</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of customers(); track customer.id) {
                <tr class="border-t border-gray-100 hover:bg-brand-50 cursor-pointer" (click)="openCustomer(customer.id)">
                <td class="px-3 sm:px-4 py-3 max-w-[140px] sm:max-w-none truncate">{{ customer.fullName }}</td>
                <td class="px-3 sm:px-4 py-3 whitespace-nowrap">{{ customer.mobile || '—'}}</td>
                <td class="px-3 sm:px-4 py-3 whitespace-nowrap">{{ customer.city || '—' }}</td>
                <td class="px-3 sm:px-4 py-3 font-mono text-xs whitespace-nowrap">{{ customer.customerCode }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                    {{ loading() ? 'Loading…' : 'No customers found.' }}
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
export class CustomerListComponent {
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly query = signal('');

  private readonly queryChanges = new Subject<string>();

  constructor(private readonly customersService: CustomersService,
    private router: Router
  ) {
    this.queryChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => this.search(q));
    this.search('');
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.queryChanges.next(value);
  }

  openCustomer(id: string): void {
    this.router.navigate(['/customers', id]);
  }

  private search(q: string): void {
    this.loading.set(true);
    this.customersService.search(q).subscribe({
      next: (res) => {
        this.customers.set(res.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}