import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RatesService } from '../../../core/services/rates-reports.service';
import { ThemeMenuComponent } from '../theme-menu/theme-menu.component';
import { RateReminderModalComponent } from '../rate-reminder-modal/rate-reminder-modal.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeMenuComponent, RateReminderModalComponent],
  template: `
    @if (showRateReminder()) {
      <app-rate-reminder-modal
        [staleMetalNames]="staleMetalNames()"
        (updateNow)="goUpdateRates()"
        (dismiss)="showRateReminder.set(false)"
      ></app-rate-reminder-modal>
    }

    <div class="flex h-screen bg-background overflow-hidden">
      @if (mobileMenuOpen()) {
        <div class="fixed inset-0 bg-black/40 z-30 md:hidden" (click)="closeMobileMenu()"></div>
      }

      <aside
        class="w-64 bg-sidebar text-sidebar-text flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:w-60"
        [class.translate-x-0]="mobileMenuOpen()"
        [class.-translate-x-full]="!mobileMenuOpen()"
      >
        <div class="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <div class="min-w-0">
            <h1 class="text-lg font-semibold tracking-wide truncate">Shree Ram Jwellers</h1>
            <p class="text-xs opacity-60 mt-0.5 truncate">Girvi Ghata Management</p>
          </div>
          <button class="md:hidden opacity-70 hover:opacity-100 p-1 shrink-0" (click)="closeMobileMenu()" aria-label="Close menu">
            ✕
          </button>
        </div>

        <nav class="flex-1 px-2 py-4 space-y-1 text-sm overflow-y-auto" (click)="closeMobileMenu()">
          <a routerLink="/dashboard" routerLinkActive="bg-white/10" class="nav-link">Dashboard</a>
          <a routerLink="/customers" routerLinkActive="bg-white/10" class="nav-link">Customers</a>
          <a routerLink="/girvi" routerLinkActive="bg-white/10" class="nav-link">Girvi Transactions</a>
          <a routerLink="/girvi/new" routerLinkActive="bg-white/10" class="nav-link">+ New Girvi</a>

          <p class="px-3 pt-4 pb-1 text-xs uppercase opacity-50">Settings</p>
          <a routerLink="/settings/rates" routerLinkActive="bg-white/10" class="nav-link">Metal Rates</a>
          <a routerLink="/settings/rules" routerLinkActive="bg-white/10" class="nav-link">Business Rules</a>
          <a routerLink="/settings/branches" routerLinkActive="bg-white/10" class="nav-link">Branches</a>
          <a routerLink="/settings/users" routerLinkActive="bg-white/10" class="nav-link">Users</a>
        </nav>

        <div class="px-3 py-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button (click)="logout()" class="text-sm opacity-70 hover:opacity-100 transition-opacity px-1 truncate">
            Sign out
          </button>
          <app-theme-menu placement="top"></app-theme-menu>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border shrink-0">
          <button class="text-brand-800 p-2 -ml-2 shrink-0" (click)="toggleMobileMenu()" aria-label="Open menu">
            <span class="block w-5 h-0.5 bg-brand-800 mb-1"></span>
            <span class="block w-5 h-0.5 bg-brand-800 mb-1"></span>
            <span class="block w-5 h-0.5 bg-brand-800"></span>
          </button>
          <h1 class="text-sm font-semibold text-brand-900 truncate flex-1 min-w-0">Shree Ram Jwellers</h1>
          <app-theme-menu placement="bottom" class="text-brand-800 shrink-0"></app-theme-menu>
        </header>

      <main class="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">
        <router-outlet></router-outlet>
      </main>
      </div>
    </div>
  `,
  styles: [
    `
      .nav-link {
        display: block;
        padding: 0.625rem 0.75rem;
        border-radius: 0.375rem;
        color: inherit;
        text-decoration: none;
      }
      .nav-link:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }
    `,
  ],
})
export class LayoutComponent implements OnInit {
  readonly mobileMenuOpen = signal(false);
  readonly showRateReminder = signal(false);
  readonly staleMetalNames = signal('');

  constructor(
    private readonly auth: AuthService,
    private readonly ratesService: RatesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // LayoutComponent is mounted once per authenticated session (it wraps
    // every authenticated route via router-outlet and isn't re-created on
    // in-app navigation), so this check runs once after login/session
    // restore — not on every route change or API call (Edge case: avoid
    // repeated popups).
    //
    // Only nag users who can actually do something about it. The backend
    // stays the source of truth either way; this just decides whether to
    // surface it as a blocking popup for this user.
    if (!this.auth.hasPermission('rate:change')) {
      return;
    }

    this.ratesService.status().subscribe({
      next: (status) => {
        if (!status.upToDate) {
          this.staleMetalNames.set(status.staleMetals.map((m) => m.name).join(', '));
          this.showRateReminder.set(true);
        }
      },
      error: () => {
        // Rates API/DB temporarily unavailable (Edge case 6): fail silent
        // rather than blocking the user with a popup we can't actually
        // back up, and never assume "unavailable" means "up to date".
      },
    });
  }

  goUpdateRates(): void {
    this.showRateReminder.set(false);
    this.router.navigate(['/settings/rates']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}