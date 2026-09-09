import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { GirviService } from '../../../core/services/girvi.service';
import { CustomersService } from '../../../core/services/customers.service';
import { RatesService } from '../../../core/services/rates-reports.service';
import { RulesService, BusinessRuleSet } from '../../../core/services/rules.service';
import { TenantsService, Branch } from '../../../core/services/tenants.service';
import { MetalsService, MetalWithPurities } from '../../../core/services/metals.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { CustomerSelectorComponent } from './customer-selector.component';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { Customer } from '../../../core/models/api-models';

interface ItemPreview {
  netWeight: number;
  fineWeight: number;
  metalValue: number;
}

interface MetalGroupPreview {
  metalCode: string;
  fineWeight: number;
  metalValue: number;
  rule: BusinessRuleSet | null;
  eligibleValue: number;
  margin: number;
  maxLoan: number;
}

@Component({
  selector: 'app-girvi-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomerSelectorComponent, SignaturePadComponent],
  templateUrl: './girvi-create.component.html',
})
export class GirviCreateComponent implements OnInit {
  readonly today = new Date().toISOString().slice(0, 10);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly branches = signal<Branch[]>([]);
  readonly metals = signal<MetalWithPurities[]>([]);
  readonly currentGoldRate = signal(0);
  readonly currentSilverRate = signal(0);

  readonly activeRules = signal<Record<string, BusinessRuleSet | null>>({ GOLD: null, SILVER: null });
  readonly rulesLoading = signal(true);
  readonly rulesError = signal<string | null>(null);

  /** True once the owner has manually typed into the Interest Rate
   * field — from that point on, auto-fill-from-active-rule stops
   * overwriting their choice (matches "the owner must be able to
   * change this value before creating the Girvi"). */
  readonly interestRateManuallyEdited = signal(false);
  readonly eligibilityPercentManuallyEdited = signal(false);

  readonly signatureDataUrl = signal<string | null>(null);
  readonly signatureError = signal<string | null>(null);
  readonly uploadingSignature = signal(false);
  private uploadedSignatureUrl: string | null = null;
  private uploadedForDataUrl: string | null = null;

  readonly form;

  private readonly formSnapshot;
  /** Whichever metal the backend would treat as "primary" for this
   * transaction (same GOLD-wins convention GirviService.create uses),
   * used to decide which metal's active rule pre-fills Interest Rate. */
  readonly primaryMetalCode = computed(() => {
    const items = (this.formSnapshot().items ?? []) as any[];
    const codes = Array.from(new Set(items.map((i) => i.metalCode).filter(Boolean)));
    return codes.includes('GOLD') ? 'GOLD' : (codes[0] ?? 'GOLD');
  });

  readonly metalGroupPreviews = computed<MetalGroupPreview[]>(() => {
    const items = (this.formSnapshot().items ?? []) as any[];
    const rates: Record<string, number> = { GOLD: this.currentGoldRate(), SILVER: this.currentSilverRate() };
    const rules = this.activeRules();
    const metalCodesInUse = Array.from(new Set(items.map((i) => i.metalCode).filter(Boolean)));

    return metalCodesInUse.map((metalCode) => {
      let fineWeight = 0;
      for (const item of items.filter((i) => i.metalCode === metalCode)) {
        const gross = Number(item.grossWeight) || 0;
        const stone = Number(item.stoneWeight) || 0;
        const netWeight = Math.max(0, gross - stone);
        const metal = this.metals().find((m) => m.code === metalCode);
        const purity = metal?.purities.find((p) => p.code === item.purityCode);
        const fineFactor = purity ? Number(purity.fineFactor) : 0;
        fineWeight += netWeight * fineFactor;
      }

      const rate = rates[metalCode] ?? 0;
      const metalValue = fineWeight * rate;
      const rule = rules[metalCode] ?? null;

      if (!rule) {
        return { metalCode, fineWeight, metalValue, rule: null, eligibleValue: 0, margin: 0, maxLoan: 0 };
      }

      const eligibilityPercent = Number(
        this.formSnapshot().eligibilityPercent ?? rule.eligibilityPercent,
      );
      const eligibleValue = (metalValue * eligibilityPercent) / 100;
      const margin = this.computeMargin(eligibleValue, rule);
      const maxLoan = this.applyPreviewRounding(Math.max(0, eligibleValue - margin), rule.roundingRule);

      return { metalCode, fineWeight, metalValue, rule, eligibleValue, margin, maxLoan };
    });
  });

  readonly totalFineWeight = computed(() => this.metalGroupPreviews().reduce((sum, g) => sum + g.fineWeight, 0));
  readonly totalMetalValue = computed(() => this.metalGroupPreviews().reduce((sum, g) => sum + g.metalValue, 0));
  readonly maxLoanPreview = computed(() => this.metalGroupPreviews().reduce((sum, g) => sum + g.maxLoan, 0));
  readonly hasMissingRules = computed(() => this.metalGroupPreviews().some((g) => !g.rule));
  readonly requestedExceedsMax = computed(
    () => Number(this.formSnapshot().requestedLoanAmount ?? 0) > this.maxLoanPreview(),
  );

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly girviService: GirviService,
    private readonly customersService: CustomersService,
    private readonly ratesService: RatesService,
    private readonly rulesService: RulesService,
    private readonly tenantsService: TenantsService,
    private readonly metalsService: MetalsService,
    private readonly uploadsService: UploadsService,
  ) {

    this.form = this.fb.group({
      branchId: ['', Validators.required],
      pledgeDate: [this.today, Validators.required],
      items: this.fb.array([this.buildItemGroup()]),
      requestedLoanAmount: [null as number | null, [Validators.required, Validators.min(1)]],
      // Populated from the primary metal's active rule via the effect
      // below; freely editable — see interestRateManuallyEdited. Upper
      // bound of 100 is a sanity cap against fat-finger entry (e.g. "400"
      // instead of "4.00"), not a business-meaningful ceiling.
      interestPercent: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
      eligibilityPercent: [null as number | null, [Validators.required,Validators.min(0),Validators.max(100)]],
    });
    this.formSnapshot = signal(this.form.getRawValue());

    this.form.valueChanges.subscribe((v) => this.formSnapshot.set(v as any));

    // Auto-fill Interest Rate from the primary metal's active rule
    // whenever the primary metal changes or rules finish loading — but
    // ONLY until the owner has manually edited the field themselves.
    // This is the "default from active rule, but overridable" behavior
    // from the requirement, implemented as a signal effect rather than
    // a one-time ngOnInit read, since the primary metal can change as
    // the owner edits pledged items.
    effect(() => {
      if (this.interestRateManuallyEdited()) return;
      const rule = this.activeRules()[this.primaryMetalCode()];
      if (rule) {
        this.form.get('interestPercent')?.setValue(Number(rule.interestPercent), { emitEvent: false });
      }
    });

    effect(() => {
      if (this.eligibilityPercentManuallyEdited()) return;
      const rule = this.activeRules()[this.primaryMetalCode()];
      if (rule) {
        this.form.get('eligibilityPercent')?.setValue(Number(rule.eligibilityPercent),{ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const customerId = this.route.snapshot.queryParamMap.get('customerId');
    if (customerId) {
      this.customersService.getById(customerId).subscribe((c) => this.selectedCustomer.set(c));
    }

    forkJoin({
      branches: this.tenantsService.listBranches(),
      metals: this.metalsService.list(),
      gold: this.ratesService.getCurrent('GOLD'),
      silver: this.ratesService.getCurrent('SILVER'),
    }).subscribe({
      next: ({ branches, metals, gold, silver }) => {
        this.branches.set(branches);
        this.metals.set(metals);
        const goldPurities = metals.find((m) => m.code === 'GOLD')?.purities ?? [];
        if (goldPurities.length) {
          this.items.at(0)?.get('purityCode')?.setValue(goldPurities[0].code);
        }
        if (branches.length) this.form.patchValue({ branchId: branches[0].id });
        this.currentGoldRate.set(Number(gold.ratePerGram));
        this.currentSilverRate.set(Number(silver.ratePerGram));
      },
      error: () => {
        // Rates/metals may not be configured for this tenant yet.
      },
    });

    forkJoin({
      goldRules: this.rulesService.getActiveVersion('GOLD'),
      silverRules: this.rulesService.getActiveVersion('SILVER'),
    }).subscribe({
      next: ({ goldRules, silverRules }) => {
        this.activeRules.set({ GOLD: goldRules, SILVER: silverRules });
        this.rulesLoading.set(false);
      },
      error: () => {
        this.rulesLoading.set(false);
        this.rulesError.set('Could not load active business rules. Please try again before creating a Girvi.');
      },
    });
  }

  onCustomerChange(customer: Customer | null): void {
    this.selectedCustomer.set(customer);
  }

  onSignatureChange(dataUrl: string | null): void {
    this.signatureDataUrl.set(dataUrl);
    if (dataUrl) this.signatureError.set(null);
  }

  onInterestRateInput(): void {
    this.interestRateManuallyEdited.set(true);
  }

  onEligibilityPercentInput(): void {
    this.eligibilityPercentManuallyEdited.set(true);
  }

  addItem(): void {
    const group = this.buildItemGroup();
    const goldPurities = this.metals().find((m) => m.code === 'GOLD')?.purities ?? [];
    if (goldPurities.length) group.get('purityCode')?.setValue(goldPurities[0].code);
    this.items.push(group);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onMetalChange(index: number): void {
    const group = this.items.at(index);
    const metalCode = group.get('metalCode')?.value;
    const purities = this.metals().find((m) => m.code === metalCode)?.purities ?? [];
    group.get('purityCode')?.setValue(purities[0]?.code ?? '');
  }

  purityOptions(metalCode: string): string[] {
    return (this.metals().find((m) => m.code === metalCode)?.purities ?? []).map((p) => p.code);
  }

  itemPreview(index: number): ItemPreview | null {
    const items = (this.formSnapshot().items ?? []) as any[];
    const item = items[index];
    if (!item) return null;
    const gross = Number(item.grossWeight) || 0;
    const stone = Number(item.stoneWeight) || 0;
    const netWeight = Math.max(0, gross - stone);
    const metal = this.metals().find((m) => m.code === item.metalCode);
    const purity = metal?.purities.find((p) => p.code === item.purityCode);
    const fineFactor = purity ? Number(purity.fineFactor) : 0;
    const fineWeight = netWeight * fineFactor;
    const rate = item.metalCode === 'SILVER' ? this.currentSilverRate() : this.currentGoldRate();
    return { netWeight, fineWeight, metalValue: fineWeight * rate };
  }

  submit(): void {
    if (this.form.invalid || !this.selectedCustomer()) return;

    if (this.rulesLoading()) {
      this.errorMessage.set('Business rules are still loading — please wait a moment and try again.');
      return;
    }
    if (this.hasMissingRules()) {
      this.errorMessage.set(
        'No active business rules are configured for one of the selected metals. Ask an admin to set them up ' +
        'in Settings → Business Rules before creating this Girvi.',
      );
      return;
    }

    if (!this.signatureDataUrl()) {
      this.signatureError.set('Customer signature is required before creating this Girvi.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.signatureError.set(null);

    this.ensureSignatureUploaded().subscribe({
      next: (signatureUrl) => this.createGirvi(signatureUrl),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not upload the signature. Please try again.');
      },
    });
  }

  private ensureSignatureUploaded(): Observable<string> {
    const dataUrl = this.signatureDataUrl()!;
    if (this.uploadedSignatureUrl && this.uploadedForDataUrl === dataUrl) {
      return of(this.uploadedSignatureUrl);
    }

    this.uploadingSignature.set(true);
    return new Observable<string>((subscriber) => {
      this.uploadsService.uploadSignature(dataUrl).subscribe({
        next: (res) => {
          this.uploadedSignatureUrl = res.url;
          this.uploadedForDataUrl = dataUrl;
          this.uploadingSignature.set(false);
          subscriber.next(res.url);
          subscriber.complete();
        },
        error: (err) => {
          this.uploadingSignature.set(false);
          subscriber.error(err);
        },
      });
    });
  }

  private createGirvi(signatureUrl: string): void {
    const value = this.form.getRawValue();
    this.girviService
      .create({
        customerId: this.selectedCustomer()!.id,
        branchId: value.branchId!,
        pledgeDate: value.pledgeDate || undefined,
        customerSignatureUrl: signatureUrl,
        interestPercent: value.interestPercent !== null ? String(value.interestPercent) : undefined,
        eligibilityPercent: value.eligibilityPercent !== null ? String(value.eligibilityPercent) : undefined,
        items: value.items!.map((i: any) => ({
          itemType: i.itemType,
          metalCode: i.metalCode,
          purityCode: i.purityCode,
          grossWeight: String(i.grossWeight),
          stoneWeight: String(i.stoneWeight ?? 0),
        })),
        requestedLoanAmount: String(value.requestedLoanAmount),
      })
      .subscribe({
        next: (transaction) => this.router.navigate(['/girvi', transaction.id]),
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not create Girvi transaction.');
        },
      });
  }

  private buildItemGroup(): FormGroup {
    return this.fb.group({
      itemType: ['', Validators.required],
      metalCode: ['GOLD', Validators.required],
      purityCode: ['', Validators.required],
      grossWeight: [null as number | null, [Validators.required, Validators.min(0.001)]],
      stoneWeight: [null as number | null],
    });
  }

  private computeMargin(eligibleValue: number, rule: BusinessRuleSet): number {
    switch (rule.marginType) {
      case 'NONE':
        return 0;
      case 'FIXED':
        return Number(rule.marginValue);
      case 'PERCENT':
        return (eligibleValue * Number(rule.marginValue)) / 100;
    }
  }

  private applyPreviewRounding(value: number, rule: BusinessRuleSet['roundingRule']): number {
    switch (rule) {
      case 'ROUND_NEAREST_1':
        return Math.round(value);
      case 'ROUND_NEAREST_10':
        return Math.round(value / 10) * 10;
      default:
        return value;
    }
  }
}