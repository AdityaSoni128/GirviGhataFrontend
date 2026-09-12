import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GirviService } from '../../core/services/girvi.service';
import { GirviTransaction } from '../../core/models/api-models';
import { DateOnlyPipe } from '../../shared/pipes/date-only.pipe';

@Component({
  selector: 'app-girvi-receipt',
  standalone: true,
  imports: [CommonModule, DateOnlyPipe],
  template: `
    @if (transaction(); as t) {
      <div class="max-w-2xl mx-auto p-10 bg-white text-sm print:p-0">
        <div class="text-center mb-6 border-b border-gray-300 pb-4">
          <h1 class="text-lg font-bold tracking-wide">SHREE RAM JWELLERS</h1>
          <p class="text-xs text-gray-500">Girvi Ghata Receipt</p>
        </div>

        <div class="grid grid-cols-2 gap-y-1 mb-6">
          <div><span class="text-gray-500">Girvi No:</span> {{ t.girviNumber }}</div>
          <div class="text-right"><span class="text-gray-500">Date:</span> {{ t.pledgeDate | dateOnly }}</div>
          <div><span class="text-gray-500">Customer:</span> {{ t.customer?.fullName || '—' }}</div>
          <div class="text-right"><span class="text-gray-500">Due Date:</span> {{ t.dueDate ? (t.dueDate | dateOnly) : '—' }}</div>
        </div>

        <table class="w-full text-xs border border-gray-300 mb-6">
          <thead class="bg-gray-50">
            <tr>
              <th class="border border-gray-300 px-2 py-1 text-left">Item</th>
              <th class="border border-gray-300 px-2 py-1 text-left">Metal</th>
              <th class="border border-gray-300 px-2 py-1 text-left">Purity</th>
              <th class="border border-gray-300 px-2 py-1 text-left">Gross Wt</th>
              <th class="border border-gray-300 px-2 py-1 text-left">Net Wt</th>
            </tr>
          </thead>
          <tbody>
            @for (item of t.items; track item.id) {
              <tr>
                <td class="border border-gray-300 px-2 py-1">{{ item.itemType }}</td>
                <td class="border border-gray-300 px-2 py-1">{{ item.metalCode }}</td>
                <td class="border border-gray-300 px-2 py-1">{{ item.purityCode }}</td>
                <td class="border border-gray-300 px-2 py-1">{{ item.grossWeight }} g</td>
                <td class="border border-gray-300 px-2 py-1">{{ item.netWeight }} g</td>
              </tr>
            }
          </tbody>
        </table>

        @if (t.valuation; as v) {
          <div class="mb-6 text-sm">
            <div class="flex justify-between py-1 border-b border-dashed border-gray-200">
              <span class="text-gray-500">Loan Amount</span><span class="font-semibold">₹{{ v.actualLoanAmount }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-dashed border-gray-200">
              <span class="text-gray-500">Interest Rate</span>
              <span class="font-semibold">{{ v.interestPercent | number: '1.2-2' }}% per month</span>
            </div>
          </div>
        }

        <div class="text-xs text-gray-600 mb-8 border-t border-gray-300 pt-3">
          <p class="mb-1"><strong>Terms:</strong> Interest applies as per the terms communicated at pledge time. Item(s)
          remain the shop's security until the outstanding balance is fully cleared and the item is redeemed.</p>
          <p>This receipt does not constitute legal advice; retain it safely and present it at the time of payment or redemption.</p>
        </div>

        <div class="grid grid-cols-2 gap-8 mt-12 text-xs">
          <div class="border-t border-gray-400 pt-1 text-center">Customer Signature</div>
          <div class="border-t border-gray-400 pt-1 text-center">Authorized Signature</div>
        </div>

        <div class="mt-8 text-center print:hidden">
          <button (click)="print()" class="btn-primary">Print</button>
        </div>
      </div>
    } @else if (loading()) {
      <p class="p-8 text-gray-500">Loading receipt…</p>
    }
  `,
  styles: [
    `
      @media print {
        :host {
          display: block;
        }
      }
    `,
  ],
})
export class GirviReceiptComponent implements OnInit {
  readonly transaction = signal<GirviTransaction | null>(null);
  readonly loading = signal(true);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly girviService: GirviService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.girviService.getById(id).subscribe({
      next: (t) => {
        this.transaction.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  print(): void {
    window.print();
  }
}