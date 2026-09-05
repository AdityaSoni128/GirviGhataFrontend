import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/api-models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PaginationComponent],
  template: `
    <div class="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <div class="flex items-center justify-between mb-6 gap-3 shrink-0">
        <h2 class="text-xl font-semibold text-brand-900">Customers</h2>
        <a routerLink="/customers/new" class="btn-primary shrink-0">+ New Customer</a>
      </div>

      <input
        type="text"
        placeholder="Search by name, mobile, customer code, Aadhaar last-4, or PAN…"
        class="input-field mb-4 shrink-0"
        [ngModel]="query()"
        (ngModelChange)="onQueryChange($event)"
      />

      <div class="card !p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div class="overflow-x-auto overflow-y-auto flex-1 min-h-0">
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
      /* CustomerListComponent renders as <app-customer-list>, a sibling of
       * <router-outlet> inside <main>. Nothing in the template above can
       * style that host tag — it needs to be an explicit flex item of
       * main (flex-1) that can also shrink below its content size
       * (min-height: 0), so the flex-1/min-h-0 chain inside the template
       * has an actual definite height to resolve against. Without this,
       * <app-customer-list> sits at height:auto and every flex-1/min-h-0
       * class inside the template is sizing against nothing. */
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
export class CustomerListComponent {
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly query = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly total = signal(0);

  private readonly queryText$ = new Subject<string>();
  private readonly refresh$ = new Subject<void>();

  constructor(private readonly customersService: CustomersService,
    private router: Router
  ) {
    this.queryText$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => {
      this.query.set(q);
      this.page.set(1);
      this.refresh$.next();
    });

    this.refresh$
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          return this.customersService.search(this.query(), this.page(), this.pageSize());
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

  onPageChange(next: number): void {
    this.page.set(next);
    this.refresh$.next();
  }

  onPageSizeChange(next: number): void {
    this.pageSize.set(next);
    this.page.set(1);
    this.refresh$.next();
  }

  openCustomer(id: string): void {
    this.router.navigate(['/customers', id]);
  }

  private applyResult(res: { results: Customer[]; total: number; page: number; pageSize: number }): void {
    this.customers.set(res.results);
    this.total.set(res.total);
    this.page.set(res.page);
    this.pageSize.set(res.pageSize);
    this.loading.set(false);
  }
}