import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RulesService, BusinessRuleSet } from '../../../core/services/rules.service';

@Component({
  selector: 'app-rules-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h2 class="text-xl font-semibold text-brand-900 mb-1">Business Rules</h2>
      <p class="text-sm text-gray-500 mb-6">
        Saving here creates a new version — past Girvi transactions keep the rule version that applied when they
        were created and are never retroactively affected.
      </p>

      <div class="flex gap-2 mb-4">
        <button
          class="px-3 py-1.5 rounded-md text-sm"
          [class.bg-brand-700]="metalTab() === 'GOLD'"
          [class.text-white]="metalTab() === 'GOLD'"
          [class.bg-gray-100]="metalTab() !== 'GOLD'"
          (click)="switchMetal('GOLD')"
        >
          Gold
        </button>
        <button
          class="px-3 py-1.5 rounded-md text-sm"
          [class.bg-brand-700]="metalTab() === 'SILVER'"
          [class.text-white]="metalTab() === 'SILVER'"
          [class.bg-gray-100]="metalTab() !== 'SILVER'"
          (click)="switchMetal('SILVER')"
        >
          Silver
        </button>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-400 mb-4">Loading current {{ metalTab() }} rules…</p>
      } @else if (noActiveRule()) {
        <p class="text-sm text-amber-600 mb-4">
          No active rule set exists yet for {{ metalTab() }} — the fields below are just a starting point; save to
          create the first version.
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="card space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Eligibility (%)</label>
            <input type="number" step="0.01" class="input-field" formControlName="eligibilityPercent" />
          </div>
          <div>
            <label class="label">Margin Type</label>
            <select class="input-field" formControlName="marginType">
              <option value="FIXED">Fixed amount</option>
              <option value="PERCENT">% of eligible value</option>
              <option value="NONE">None</option>
            </select>
          </div>
          <div>
            <label class="label">Margin Value</label>
            <input type="number" step="0.01" class="input-field" formControlName="marginValue" />
          </div>
          <div>
            <label class="label">Interest Method</label>
            <select class="input-field" formControlName="interestMethod">
              <option value="FLAT_MONTHLY">Flat Monthly</option>
              <option value="DAILY">Daily</option>
              <option value="REDUCING_BALANCE">Reducing Balance</option>
            </select>
          </div>
          <div>
            <label class="label">Interest (%)</label>
            <input type="number" step="0.01" class="input-field" formControlName="interestPercent" />
          </div>
          <div>
            <label class="label">Grace Period (days)</label>
            <input type="number" class="input-field" formControlName="gracePeriodDays" />
          </div>
          <div>
            <label class="label">Rounding</label>
            <select class="input-field" formControlName="roundingRule">
              <option value="NONE">None</option>
              <option value="ROUND_NEAREST_1">Nearest ₹1</option>
              <option value="ROUND_NEAREST_10">Nearest ₹10</option>
            </select>
          </div>
        </div>

        @if (message()) {
          <p class="text-sm" [class.text-green-700]="!isError()" [class.text-red-600]="isError()">
            {{ message() }}
          </p>
        }

        <button type="submit" class="btn-primary w-full sm:w-auto" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving…' : 'Save as New Version' }}
        </button>
      </form>

      <div class="card mt-6 !p-0 overflow-hidden">
        <h3 class="text-sm font-semibold text-gray-600 px-4 pt-4 pb-2">Version History</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-brand-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th class="px-3 sm:px-4 py-2 whitespace-nowrap">Version</th>
                <th class="px-3 sm:px-4 py-2 whitespace-nowrap">Eligibility</th>
                <th class="px-3 sm:px-4 py-2 whitespace-nowrap">Margin</th>
                <th class="px-3 sm:px-4 py-2 whitespace-nowrap">Interest</th>
                <th class="px-3 sm:px-4 py-2 whitespace-nowrap">Active</th>
              </tr>
            </thead>
            <tbody>
              @for (v of versions(); track v.id) {
                <tr class="border-t border-gray-100">
                  <td class="px-3 sm:px-4 py-2 whitespace-nowrap">v{{ v.version }}</td>
                  <td class="px-3 sm:px-4 py-2 whitespace-nowrap">{{ v.eligibilityPercent }}%</td>
                  <td class="px-3 sm:px-4 py-2 whitespace-nowrap">{{ v.marginType }} ({{ v.marginValue }})</td>
                  <td class="px-3 sm:px-4 py-2 whitespace-nowrap">{{ v.interestPercent }}% {{ v.interestMethod }}</td>
                  <td class="px-3 sm:px-4 py-2 whitespace-nowrap">{{ v.isActive ? 'Yes' : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class RulesSettingsComponent implements OnInit {
  readonly metalTab = signal<'GOLD' | 'SILVER'>('GOLD');
  readonly versions = signal<BusinessRuleSet[]>([]);
  readonly loading = signal(true);
  readonly noActiveRule = signal(false);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);

  /**
   * These starting values are used ONLY when a metal has no active rule
   * set yet (first-time setup, before anything exists in the DB to
   * reflect) — see `noActiveRule()`. The moment an active rule exists,
   * `load()` overwrites every field with the real DB values below, so
   * this screen never silently displays a hardcoded number over real
   * stored data.
   */
  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly rulesService: RulesService,
  ) {
    this.form = this.fb.group({
      eligibilityPercent: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      marginType: ['FIXED' as 'FIXED' | 'PERCENT' | 'NONE', Validators.required],
      marginValue: [5000, [Validators.required, Validators.min(0)]],
      interestMethod: ['FLAT_MONTHLY' as 'FLAT_MONTHLY' | 'DAILY' | 'REDUCING_BALANCE', Validators.required],
      interestPercent: [2, [Validators.required, Validators.min(0)]],
      gracePeriodDays: [0, [Validators.required, Validators.min(0)]],
      roundingRule: ['ROUND_NEAREST_10' as 'NONE' | 'ROUND_NEAREST_1' | 'ROUND_NEAREST_10', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  switchMetal(metal: 'GOLD' | 'SILVER'): void {
    this.metalTab.set(metal);
    this.load();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set(null);

    const value = this.form.getRawValue();
    this.rulesService
      .createNewVersion({
        metalCode: this.metalTab(),
        eligibilityPercent: String(value.eligibilityPercent),
        marginType: value.marginType!,
        marginValue: String(value.marginValue),
        interestMethod: value.interestMethod!,
        interestPercent: String(value.interestPercent),
        gracePeriodDays: value.gracePeriodDays!,
        roundingRule: value.roundingRule!,
        paymentAllocationOrder: ['PENALTY', 'CHARGES', 'INTEREST', 'PRINCIPAL'],
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.isError.set(false);
          this.message.set('New rule version saved and activated.');
          this.load();
        },
        error: (err) => {
          this.saving.set(false);
          this.isError.set(true);
          this.message.set(err?.error?.message ?? 'Could not save rules.');
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.rulesService.listVersions(this.metalTab()).subscribe({
      next: (versions) => {
        this.versions.set(versions);
        this.loading.set(false);

        const active = versions.find((v) => v.isActive);
        this.noActiveRule.set(!active);
        if (active) {
          // Overwrite the form with the REAL active values from the DB —
          // this is the fix: previously this form always showed its
          // static defaults (70/5000/2/0/ROUND_NEAREST_10) even when a
          // different rule was already active.
          this.form.patchValue({
            eligibilityPercent: Number(active.eligibilityPercent),
            marginType: active.marginType,
            marginValue: Number(active.marginValue),
            interestMethod: active.interestMethod,
            interestPercent: Number(active.interestPercent),
            gracePeriodDays: active.gracePeriodDays,
            roundingRule: active.roundingRule,
          });
        }
      },
      error: () => {
        this.versions.set([]);
        this.loading.set(false);
      },
    });
  }
}