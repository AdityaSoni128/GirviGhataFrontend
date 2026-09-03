import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rate-reminder-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
        <h3 class="text-lg font-semibold text-brand-900 mb-2">Update Today's Metal Rates</h3>
        <p class="text-sm text-gray-600 mb-4">
          Today's metal rates haven't been set yet
          @if (staleMetalNames) {
            <span> for {{ staleMetalNames }}</span>
          }.
          Loan valuations depend on an up-to-date rate — please update it before creating new Girvi entries today.
        </p>
        <div class="flex justify-end gap-3">
          <button (click)="dismiss.emit()" class="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
            Remind me later
          </button>
          <button (click)="updateNow.emit()" class="btn-primary">
            Update Rates
          </button>
        </div>
      </div>
    </div>
  `,
})
export class RateReminderModalComponent {
  @Input() staleMetalNames = '';
  @Output() updateNow = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
}
