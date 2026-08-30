import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/api-models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [class.p-8]="!embedded" [class.max-w-2xl]="!embedded" [class.mx-auto]="!embedded">
      @if (!embedded) {
        <h2 class="text-xl font-semibold text-brand-900 mb-6">New Customer</h2>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" [class.card]="!embedded" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Full Name *</label>
            <input class="input-field" formControlName="fullName" />
          </div>
          <div>
            <label class="label">Father's / Husband's Name</label>
            <input class="input-field" formControlName="guardianName" />
          </div>
          <div>
            <label class="label">Mobile *</label>
            <input class="input-field" formControlName="mobile" />
          </div>
          <div>
            <label class="label">Alternate Mobile</label>
            <input class="input-field" formControlName="altMobile" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Address</label>
            <input class="input-field" formControlName="addressLine1" />
          </div>
          <div>
            <label class="label">City*</label>
            <input class="input-field" formControlName="city" />
          </div>
          <div>
            <label class="label">State</label>
            <input class="input-field" formControlName="state" />
          </div>
          <div>
            <label class="label">Pincode</label>
            <input class="input-field" formControlName="pincode" />
          </div>
        </div>

        <hr class="my-2" />
        <p class="text-sm font-medium text-gray-600">KYC (optional at creation)</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Aadhaar Number</label>
            <input class="input-field" formControlName="aadhaarNumber" maxlength="12" />
          </div>
          <div>
            <label class="label">PAN Number</label>
            <input class="input-field" formControlName="panNumber" />
          </div>
        </div>

        @if (errorMessage()) {
          <p class="text-sm text-red-600">{{ errorMessage() }}</p>
        }

        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn-primary w-full sm:w-auto" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Save Customer' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CustomerFormComponent {
  /** When true, renders without page padding/heading/card border (used
   * inline inside CustomerSelectorComponent) and emits `created` instead
   * of navigating away — the standalone /customers/new route usage is
   * unaffected (embedded defaults to false). */
  @Input() embedded = false;
  @Output() created = new EventEmitter<Customer>();

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly customersService: CustomersService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
    fullName: ['', Validators.required],
    guardianName: [''],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    altMobile: [''],
    addressLine1: [''],
    city: ['',[Validators.required]],
    state: [''],
    pincode: [''],
    aadhaarNumber: [''],
    panNumber: [''],
  });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const payload = {
      fullName: value.fullName!,
      guardianName: value.guardianName || undefined,
      mobile: value.mobile!,
      altMobile: value.altMobile || undefined,
      addressLine1: value.addressLine1 || undefined,
      city: value.city || undefined,
      state: value.state || undefined,
      pincode: value.pincode || undefined,
      aadhaarNumber: value.aadhaarNumber || undefined,
      panNumber: value.panNumber || undefined,
    };

    this.customersService.create(payload).subscribe({
      next: (customer) => {
        if (this.embedded) {
          this.saving.set(false);
          this.form.reset();
          this.created.emit(customer);
        } else {
          this.router.navigate(['/customers', customer.id]);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not save customer.');
      },
    });
  }
}