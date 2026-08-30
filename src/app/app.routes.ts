import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'girvi/:id/receipt',
    canActivate: [authGuard],
    loadComponent: () => import('./features/receipts/girvi-receipt.component').then((m) => m.GirviReceiptComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list.component').then((m) => m.CustomerListComponent),
      },
      {
        path: 'customers/new',
        loadComponent: () =>
          import('./features/customers/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./features/customers/customer-detail/customer-detail.component').then(
            (m) => m.CustomerDetailComponent,
          ),
      },
      {
        path: 'girvi',
        loadComponent: () =>
          import('./features/girvi/girvi-list/girvi-list.component').then((m) => m.GirviListComponent),
      },
      {
        path: 'girvi/new',
        loadComponent: () =>
          import('./features/girvi/girvi-create/girvi-create.component').then((m) => m.GirviCreateComponent),
      },
      {
        path: 'girvi/:id',
        loadComponent: () =>
          import('./features/girvi/girvi-detail/girvi-detail.component').then((m) => m.GirviDetailComponent),
      },
      {
        path: 'reports/customer-statement/:customerId',
        loadComponent: () =>
          import('./features/reports/customer-statement/customer-statement.component').then(
            (m) => m.CustomerStatementComponent,
          ),
      },
      {
        path: 'settings/rates',
        loadComponent: () =>
          import('./features/settings/rates/rates-settings.component').then((m) => m.RatesSettingsComponent),
      },
      {
        path: 'settings/rules',
        loadComponent: () =>
          import('./features/settings/rules/rules-settings.component').then((m) => m.RulesSettingsComponent),
      },
      {
        path: 'settings/users',
        loadComponent: () =>
          import('./features/settings/users/users-settings.component').then((m) => m.UsersSettingsComponent),
      },
      {
        path: 'settings/branches',
        loadComponent: () =>
          import('./features/settings/branches/branches-settings.component').then(
            (m) => m.BranchesSettingsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
