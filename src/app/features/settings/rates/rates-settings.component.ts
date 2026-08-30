import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RatesService } from '../../../core/services/rates-reports.service';
import { MetalRate } from '../../../core/models/api-models';

@Component({
  selector: 'app-rates-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h2 class="text-xl font-semibold text-brand-900 mb-6">Metal Rates</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="card">
          <p class="text-xs text-gray-500 uppercase">Current Gold Rate</p>
          <p class="text-2xl font-semibold text-gold-600 mt-1 break-words">
            {{ goldRate() ? '₹' + goldRate()!.ratePerGram + '/g' : '—' }}
          </p>
        </div>
        <div class="card">
          <p class="text-xs text-gray-500 uppercase">Current Silver Rate</p>
          <p class="text-2xl font-semibold text-gray-600 mt-1 break-words">
            {{ silverRate() ? '₹' + silverRate()!.ratePerGram + '/g' : '—' }}
          </p>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-gray-600 mb-3">Update Rate</h3>
        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-end">
          <div class="w-full sm:w-32">
            <label class="label">Metal</label>
            <select class="input-field" formControlName="metalCode">
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
            </select>
          </div>
          <div class="w-full sm:w-40">
            <label class="label">Rate per gram (₹)</label>
            <input type="number" step="0.01" class="input-field" formControlName="ratePerGram" />
          </div>
          <button type="submit" class="btn-primary w-full sm:w-auto" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Update Rate' }}
          </button>
        </form>
        @if (message()) {
          <p class="text-sm mt-2" [class.text-green-700]="!isError()" [class.text-red-600]="isError()">
            {{ message() }}
          </p>
        }
        <p class="text-xs text-gray-400 mt-2">
          Updating a rate never changes past Girvi valuations — each transaction keeps the rate that was in effect
          when it was pledged.
        </p>
      </div>
    </div>
  `,
})
export class RatesSettingsComponent implements OnInit {
  readonly goldRate = signal<MetalRate | null>(null);
  readonly silverRate = signal<MetalRate | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly ratesService: RatesService,
  ) {
    this.form = this.fb.group({
      metalCode: ['GOLD', Validators.required],
      // Blank by default (UI-only change) — was `0`. required+min still
      // fully enforced; submit is guarded by `if (this.form.invalid) return;`.
      ratePerGram: [null as number | null, [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.loadCurrentRates();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set(null);

    const { metalCode, ratePerGram } = this.form.getRawValue();
    this.ratesService.setRate(metalCode!, String(ratePerGram)).subscribe({
      next: () => {
        this.saving.set(false);
        this.isError.set(false);
        this.message.set('Rate updated.');
        this.loadCurrentRates();
        this.form.patchValue({ ratePerGram: null });
      },
      error: (err) => {
        this.saving.set(false);
        this.isError.set(true);
        this.message.set(err?.error?.message ?? 'Could not update rate.');
      },
    });
  }

  private loadCurrentRates(): void {
    this.ratesService.getCurrent('GOLD').subscribe({
      next: (r) => this.goldRate.set(r),
      error: () => this.goldRate.set(null),
    });
    this.ratesService.getCurrent('SILVER').subscribe({
      next: (r) => this.silverRate.set(r),
      error: () => this.silverRate.set(null),
    });
  }
}