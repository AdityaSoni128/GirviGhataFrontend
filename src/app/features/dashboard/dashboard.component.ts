import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportsService } from '../../core/services/rates-reports.service';
import { DashboardSummary } from '../../core/models/api-models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-brand-900">Dashboard</h2>
        <a routerLink="/girvi/new" class="btn-primary">+ New Girvi</a>
      </div>

      @if (summary(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Active Girvi</p>
            <p class="text-2xl font-semibold text-brand-800 mt-1">{{ s.activeGirviCount }}</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Principal Outstanding</p>
            <p class="text-2xl font-semibold text-brand-800 mt-1">₹{{ s.principalOutstanding | number: '1.0-2' }}</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Interest Outstanding</p>
            <p class="text-2xl font-semibold text-brand-800 mt-1">₹{{ s.interestOutstanding | number: '1.0-2' }}</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Today's Collections</p>
            <p class="text-2xl font-semibold text-green-700 mt-1">₹{{ s.todaysCollections | number: '1.0-2' }}</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">This Month's Collections</p>
            <p class="text-2xl font-semibold text-green-700 mt-1">₹{{ s.monthCollections | number: '1.0-2' }}</p>
          </div>
          <div class="card" [class.border-red-300]="s.overdueCount > 0">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Overdue Accounts</p>
            <p class="text-2xl font-semibold mt-1" [class.text-red-600]="s.overdueCount > 0">{{ s.overdueCount }}</p>
          </div>
          <div class="card" [class.border-amber-300]="s.dueSoonCount > 0">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Due Within 7 Days</p>
            <p class="text-2xl font-semibold mt-1" [class.text-amber-600]="s.dueSoonCount > 0">{{ s.dueSoonCount }}</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Gold Pledged</p>
            <p class="text-2xl font-semibold text-gold-600 mt-1">{{ s.goldPledgedGrams | number: '1.0-3' }} g</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Silver Pledged</p>
            <p class="text-2xl font-semibold text-gray-600 mt-1">{{ s.silverPledgedGrams | number: '1.0-3' }} g</p>
          </div>
          <div class="card">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Cash Deployed</p>
            <p class="text-2xl font-semibold text-brand-800 mt-1">₹{{ s.totalCashDeployed | number: '1.0-2' }}</p>
          </div>
        </div>
      } @else if (loading()) {
        <p class="text-gray-500">Loading dashboard…</p>
      } @else {
        <p class="text-red-600">Could not load dashboard data.</p>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);

  constructor(private readonly reportsService: ReportsService) {}

  ngOnInit(): void {
    this.reportsService.dashboard().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
