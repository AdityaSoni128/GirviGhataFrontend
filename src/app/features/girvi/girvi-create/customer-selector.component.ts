import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/api-models';
import { CustomerFormComponent } from '../../customers/customer-form/customer-form.component';

/**
 * Reusable customer picker for New Girvi. Supports three states:
 *  - a customer already selected (via `initialCustomer`, e.g. opened from
 *    a customer's profile, or picked/created in this component)
 *  - search & select an existing customer (reuses CustomersService.search)
 *  - inline creation of a new customer (reuses CustomerFormComponent in
 *    embedded mode — no duplicated form/API logic)
 *
 * `initialCustomer` may arrive asynchronously (e.g. New Girvi fetches it
 * by id from a query param after this component has already initialized
 * in search mode) — ngOnChanges picks that up and switches to the
 * "selected" view without the user having to do anything.
 */
@Component({
  selector: 'app-customer-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerFormComponent],
  templateUrl: './customer-selector.component.html',
})
export class CustomerSelectorComponent implements OnInit, OnChanges {
  @Input() initialCustomer: Customer | null = null;
  @Output() customerChange = new EventEmitter<Customer | null>();

  readonly selected = signal<Customer | null>(null);
  readonly mode = signal<'search' | 'create'>('search');
  readonly query = signal('');
  readonly results = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private readonly queryChanges = new Subject<string>();

  constructor(private readonly customersService: CustomersService) {
    this.queryChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => this.search(q));
  }

  ngOnInit(): void {
    if (this.initialCustomer) {
      this.selected.set(this.initialCustomer);
    } else {
      this.search('');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only auto-adopt a late-arriving initialCustomer if the user hasn't
    // already picked/created one themselves in the meantime.
    if (changes['initialCustomer'] && this.initialCustomer && !this.selected()) {
      this.selected.set(this.initialCustomer);
    }
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.queryChanges.next(value);
  }

  selectCustomer(customer: Customer): void {
    this.selected.set(customer);
    this.customerChange.emit(customer);
  }

  changeCustomer(): void {
    this.selected.set(null);
    this.mode.set('search');
    this.customerChange.emit(null);
    this.search(this.query());
  }

  showCreateForm(): void {
    this.mode.set('create');
  }

  cancelCreate(): void {
    this.mode.set('search');
  }

  onCustomerCreated(customer: Customer): void {
    this.mode.set('search');
    this.selectCustomer(customer);
  }

  private search(q: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.customersService.search(q, 1, 10).subscribe({
      next: (res) => {
        this.results.set(res.results);
        this.loading.set(false);
        this.searched.set(true);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
        this.searched.set(true);
        this.errorMessage.set('Could not load customers. Please try again.');
      },
    });
  }
}