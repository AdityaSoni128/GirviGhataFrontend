import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GirviService } from '../../../core/services/girvi.service';
import { PaymentsService, RedemptionService } from '../../../core/services/payments.service';
import { AuctionService } from '../../../core/services/auction.service';
import { CurrentValuationResponse, GirviTransaction, OutstandingSummary, Payment } from '../../../core/models/api-models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-girvi-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './girvi-detail.component.html',
})
export class GirviDetailComponent implements OnInit {
  readonly today = new Date().toISOString().slice(0, 10);

  readonly transaction = signal<GirviTransaction | null>(null);
  readonly outstanding = signal<OutstandingSummary | null>(null);
  readonly currentValuation = signal<CurrentValuationResponse | null>(null);
  readonly loading = signal(true);
  readonly paymentSaving = signal(false);
  readonly paymentError = signal<string | null>(null);
  readonly redeemError = signal<string | null>(null);
  readonly redeeming = signal(false);
  readonly reversingId = signal<string | null>(null);
  readonly auctionMessage = signal<string | null>(null);
  readonly auctionBusy = signal(false);

  readonly showTopUpForm = signal(false);
  readonly topUpSaving = signal(false);
  readonly topUpError = signal<string | null>(null);

  readonly canReceivePayment: boolean;
  readonly canRedeem: boolean;
  readonly canCancelPayment: boolean;
  readonly canManageAuction: boolean;
  readonly canTopUp: boolean;

  readonly paymentForm;

  readonly saleForm;

  readonly topUpForm;

  private girviId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly girviService: GirviService,
    private readonly paymentsService: PaymentsService,
    private readonly redemptionService: RedemptionService,
    private readonly auctionService: AuctionService,
    auth: AuthService,
  ) {

    this.paymentForm = this.fb.group({
      // Blank by default (UI-only change) — was `0`. required+min still
      // fully enforced; nothing downstream needed to change since submit
      // is guarded by `if (this.paymentForm.invalid) return;`.
      amount: [null as number | null, [Validators.required, Validators.min(1)]],
      paymentDate: [this.today, Validators.required],
      mode: ['CASH' as 'CASH' | 'UPI' | 'BANK' | 'OTHER', Validators.required],
      referenceNumber: [''],
    });

    this.saleForm = this.fb.group({
      finalSaleAmount: [null as number | null, [Validators.required, Validators.min(1)]],
      buyerName: ['', Validators.required],
    });
    this.topUpForm = this.fb.group({
      amount: [null as number | null, [Validators.required, Validators.min(1)]],
      topUpDate: [this.today, Validators.required],
      // Radio-style choice, kept as a string ('yes'/'no') for straightforward
      // template binding, converted to boolean on submit.
      applyPreviousInterestStartDate: ['yes' as 'yes' | 'no', Validators.required],
    });
    this.canReceivePayment = auth.hasPermission('payment:receive');
    this.canRedeem = auth.hasPermission('item:redeem');
    this.canCancelPayment = auth.hasPermission('payment:cancel');
    this.canManageAuction = auth.hasPermission('auction:manage');
    this.canTopUp = auth.hasPermission('girvi:modify');
  }

  ngOnInit(): void {
    this.girviId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  isOpenStatus(status: string): boolean {
    return ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE', 'RENEWED'].includes(status);
  }

  toggleTopUpForm(): void {
    this.showTopUpForm.update((v) => !v);
    this.topUpError.set(null);
  }

  submitTopUp(): void {
    if (this.topUpForm.invalid) return;
    this.topUpSaving.set(true);
    this.topUpError.set(null);

    const value = this.topUpForm.getRawValue();
    this.girviService
      .topUp(this.girviId, {
        amount: String(value.amount),
        topUpDate: value.topUpDate || undefined,
        applyPreviousInterestStartDate: value.applyPreviousInterestStartDate === 'yes',
      })
      .subscribe({
        next: () => {
          this.topUpSaving.set(false);
          this.showTopUpForm.set(false);
          this.topUpForm.reset({ amount: null, topUpDate: this.today, applyPreviousInterestStartDate: 'yes' });
          this.load();
        },
        error: (err) => {
          this.topUpSaving.set(false);
          this.topUpError.set(err?.error?.message ?? 'Could not add top-up.');
        },
      });
  }

  recordPayment(): void {
    if (this.paymentForm.invalid) return;
    this.paymentSaving.set(true);
    this.paymentError.set(null);

    const value = this.paymentForm.getRawValue();
    this.paymentsService
      .receive({
        girviTransactionId: this.girviId,
        amount: String(value.amount),
        mode: value.mode!,
        paymentDate: value.paymentDate || undefined,
        referenceNumber: value.referenceNumber || undefined,
      })
      .subscribe({
        next: () => {
          this.paymentSaving.set(false);
          this.paymentForm.reset({ amount: null, mode: 'CASH', referenceNumber: '', paymentDate: this.today });
          this.load();
        },
        error: (err) => {
          this.paymentSaving.set(false);
          this.paymentError.set(err?.error?.message ?? 'Could not record payment.');
        },
      });
  }

  redeem(): void {
    this.redeeming.set(true);
    this.redeemError.set(null);
    this.redemptionService.redeem(this.girviId).subscribe({
      next: () => {
        this.redeeming.set(false);
        this.load();
      },
      error: (err) => {
        this.redeeming.set(false);
        this.redeemError.set(err?.error?.message ?? 'Could not redeem this transaction.');
      },
    });
  }

  reversePayment(payment: Payment): void {
    const reason = prompt('Reason for reversing this payment:');
    if (!reason) return;
    this.reversingId.set(payment.id);
    this.paymentsService.reverse(payment.id, reason).subscribe({
      next: () => {
        this.reversingId.set(null);
        this.load();
      },
      error: (err) => {
        this.reversingId.set(null);
        this.paymentError.set(err?.error?.message ?? 'Could not reverse payment.');
      },
    });
  }

  sendAuctionNotice(): void {
    this.auctionBusy.set(true);
    this.auctionMessage.set(null);
    this.auctionService.sendNotice(this.girviId).subscribe({
      next: () => {
        this.auctionBusy.set(false);
        this.load();
      },
      error: (err) => {
        this.auctionBusy.set(false);
        this.auctionMessage.set(err?.error?.message ?? 'Could not send auction notice.');
      },
    });
  }

  markAuctionEligible(): void {
    this.auctionBusy.set(true);
    this.auctionMessage.set(null);
    this.auctionService.markEligible(this.girviId).subscribe({
      next: () => {
        this.auctionBusy.set(false);
        this.load();
      },
      error: (err) => {
        this.auctionBusy.set(false);
        this.auctionMessage.set(err?.error?.message ?? 'Could not mark eligible.');
      },
    });
  }

  scheduleAuction(): void {
    const dateStr = prompt('Schedule date (YYYY-MM-DD):');
    if (!dateStr) return;
    this.auctionBusy.set(true);
    this.auctionMessage.set(null);
    this.auctionService.schedule(this.girviId, new Date(dateStr).toISOString()).subscribe({
      next: () => {
        this.auctionBusy.set(false);
        this.load();
      },
      error: (err) => {
        this.auctionBusy.set(false);
        this.auctionMessage.set(err?.error?.message ?? 'Could not schedule auction.');
      },
    });
  }

  recordAuctionSale(): void {
    if (this.saleForm.invalid) return;
    const value = this.saleForm.getRawValue();
    this.auctionBusy.set(true);
    this.auctionMessage.set(null);
    this.auctionService.recordSale(this.girviId, String(value.finalSaleAmount), value.buyerName!).subscribe({
      next: () => {
        this.auctionBusy.set(false);
        this.load();
      },
      error: (err) => {
        this.auctionBusy.set(false);
        this.auctionMessage.set(err?.error?.message ?? 'Could not record sale.');
      },
    });
  }

  closeAuctionCase(): void {
    this.auctionBusy.set(true);
    this.auctionMessage.set(null);
    this.auctionService.close(this.girviId).subscribe({
      next: () => {
        this.auctionBusy.set(false);
        this.load();
      },
      error: (err) => {
        this.auctionBusy.set(false);
        this.auctionMessage.set(err?.error?.message ?? 'Could not close case.');
      },
    });
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
    this.girviService.getById(this.girviId).subscribe({
      next: (t) => {
        this.transaction.set(t);
        this.loading.set(false);
        if (this.isOpenStatus(t.status)) {
          this.paymentsService.getOutstanding(this.girviId).subscribe((o) => this.outstanding.set(o));
          this.girviService.getCurrentValuation(this.girviId).subscribe({
            next: (v) => this.currentValuation.set(v),
            error: () => this.currentValuation.set(null),
          });
        } else {
          this.outstanding.set(null);
          this.currentValuation.set(null);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}