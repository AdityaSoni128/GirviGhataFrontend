# Girvi Ghata Management - Frontend

Angular 18 (standalone components, signals) frontend against the NestJS
backend built earlier. Tailwind for styling, no server-side rendering, no
state library beyond Angular signals + RxJS.

## What's built and working

**Core**
- Auth: login, JWT in localStorage, HTTP interceptor with single
  silent refresh-and-retry on 401, route guard, permission checks via
  `AuthService.hasPermission()` (decoded from the JWT - display-only,
  never a trust boundary; the backend enforces for real).
- Layout: sidebar nav (Dashboard / Customers / Girvi / Settings) + sign-out.

**Customers**
- Search-as-you-type list, create form (optional KYC fields), detail/
  profile view with transaction history and permission-gated, audited
  KYC unmask.

**Girvi**
- **Creation screen (Section 14)** - multi-item, per-item metal/purity/
  weight entry, live-updating estimate panel, exceeds-max warning.
  Purity options are now fetched from the real `GET /metals` endpoint,
  not hardcoded - the estimate is still a client-side preview using the
  tenant's *current* rate, but it no longer breaks for tenants with
  custom purities.
- **Detail screen** - frozen valuation, live outstanding, items table,
  payment recording, redemption action, payment history with
  permission-gated reversal, and a full auction-workflow panel
  (Notice -> Eligible -> Schedule -> Record Sale -> Close) that appears
  once a loan is OVERDUE.
- List screen with status filter.
- **Printable receipt** (`/girvi/:id/receipt`) - Section 37's Girvi
  receipt, print-styled, linked from the detail screen.

**Settings** (new this round)
- Metal Rates - view current gold/silver rate, set a new one.
- Business Rules - versioned eligibility/margin/interest/rounding editor
  per metal, with version history table.
- Branches - list + create.
- Users - list + create (with role and branch checkboxes) + deactivate.

**Reports**
- Dashboard summary cards.
- Customer statement (bank-statement-style running balance), linked from
  the customer detail screen.

## What is still NOT built

- **No role-creation UI** - `TenantsService.createRole()` exists but no
  screen calls it; new users can only be assigned existing seeded roles.
- **No vault/packet/QR UI** (Sections 20-22) - backend endpoints exist,
  nothing in the frontend calls them.
- **No cash-book / daily-closing / metal-by-purity / collections-by-staff
  report screens** - all four backend endpoints exist and work; only
  the dashboard and customer statement have frontend screens.
- **No payment receipt print view** - only the Girvi receipt is built;
  a payment/redemption receipt view would follow the same pattern.
- **No i18n, no white-label theming beyond the hardcoded brand color, no
  phone-tested responsive layout, no component tests.**
- **This has never been run.** No network access in this environment to
  `npm install` / `ng serve`. Angular's strict template checking
  (`strictTemplates: true`) will likely surface a few first-run issues -
  expect that, not a sign of a broken design.

## Running locally

```bash
npm install
npm start   # ng serve, http://localhost:4200
```

Needs the backend running at `http://localhost:3000` (see
`src/environments/environment.ts`).

## Suggested next steps

1. Run both projects together for the first time and fix what surfaces.
2. Role-creation screen (quick - the API and pattern already exist from
   the branches/users screens).
3. Vault/packet UI and the remaining report screens.
4. Payment/redemption receipt views alongside the existing Girvi receipt.
