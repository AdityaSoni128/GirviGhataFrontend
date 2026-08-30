import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import {
  TenantsService,
  TenantUser,
  Role,
  Branch,
} from "../../../core/services/tenants.service";

@Component({
  selector: "app-users-settings",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h2 class="text-xl font-semibold text-brand-900 mb-6">Users</h2>

      <div class="card mb-6">
        <h3 class="text-sm font-semibold text-gray-600 mb-3">Add User</h3>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Full Name</label>
              <input class="input-field" formControlName="fullName" />
            </div>
            <div>
              <label class="label">Email</label>
              <input type="email" class="input-field" formControlName="email" />
            </div>
            <div>
              <label class="label">Temporary Password</label>
              <input
                type="text"
                class="input-field"
                formControlName="password"
              />
            </div>
          </div>

          <div>
            <label class="label">Roles</label>
            <div class="flex flex-wrap gap-2">
              @for (role of roles(); track role.id) {
                <label
                  class="text-sm flex items-center gap-1 border rounded-md px-2 py-1"
                >
                  <input
                    type="checkbox"
                    [value]="role.id"
                    (change)="toggleRole(role.id, $event)"
                  />
                  {{ role.name }}
                </label>
              }
            </div>
          </div>

          <div>
            <label class="label">Branches</label>
            <div class="flex flex-wrap gap-2">
              @for (branch of branches(); track branch.id) {
                <label
                  class="text-sm flex items-center gap-1 border rounded-md px-2 py-1"
                >
                  <input
                    type="checkbox"
                    [value]="branch.id"
                    (change)="toggleBranch(branch.id, $event)"
                  />
                  {{ branch.name }}
                </label>
              }
            </div>
          </div>

          @if (message()) {
            <p
              class="text-sm"
              [class.text-green-700]="!isError()"
              [class.text-red-600]="isError()"
            >
              {{ message() }}
            </p>
          }

          <button
            type="submit"
            class="btn-primary w-full sm:w-auto"
            [disabled]="form.invalid || saving()"
          >
            {{ saving() ? "Saving…" : "Create User" }}
          </button>
        </form>
      </div>

      <div class="card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead
              class="bg-brand-50 text-left text-xs uppercase text-gray-500"
            >
              <tr>
                <th class="px-3 sm:px-4 py-2">Name</th>
                <th class="px-3 sm:px-4 py-2">Email</th>
                <th class="px-3 sm:px-4 py-2">Roles</th>
                <th class="px-3 sm:px-4 py-2 whitespace-nowrap">Status</th>
                <th class="px-3 sm:px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="border-t border-gray-100">
                  <td
                    class="px-3 sm:px-4 py-2 max-w-[120px] sm:max-w-none truncate"
                  >
                    {{ user.fullName }}
                  </td>
                  <td
                    class="px-3 sm:px-4 py-2 max-w-[160px] sm:max-w-none truncate"
                  >
                    {{ user.email }}
                  </td>
                  <td
                    class="px-3 sm:px-4 py-2 max-w-[140px] sm:max-w-none truncate"
                  >
                    {{ roleNames(user) }}
                  </td>
                  <td class="px-3 sm:px-4 py-2 whitespace-nowrap">
                    {{ user.isActive ? "Active" : "Deactivated" }}
                  </td>
                  <td class="px-3 sm:px-4 py-2 text-right whitespace-nowrap">
                    @if (user.isActive) {
                      <button
                        (click)="deactivate(user.id)"
                        class="text-xs text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class UsersSettingsComponent implements OnInit {
  readonly users = signal<TenantUser[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);

  private selectedRoleIds = new Set<string>();
  private selectedBranchIds = new Set<string>();

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly tenantsService: TenantsService,
  ) {
    this.form = this.fb.group({
      fullName: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.tenantsService.listUsers().subscribe((u) => this.users.set(u));
    this.tenantsService.listRoles().subscribe((r) => this.roles.set(r));
    this.tenantsService.listBranches().subscribe((b) => this.branches.set(b));
  }

  toggleRole(roleId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked
      ? this.selectedRoleIds.add(roleId)
      : this.selectedRoleIds.delete(roleId);
  }

  toggleBranch(branchId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked
      ? this.selectedBranchIds.add(branchId)
      : this.selectedBranchIds.delete(branchId);
  }

  roleNames(user: TenantUser): string {
    return user.roles.map((r) => r.role.name).join(", ") || "—";
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set(null);

    const value = this.form.getRawValue();
    this.tenantsService
      .createUser({
        fullName: value.fullName!,
        email: value.email!,
        password: value.password!,
        roleIds: Array.from(this.selectedRoleIds),
        branchIds: Array.from(this.selectedBranchIds),
      })
      .subscribe({
        next: (user) => {
          this.saving.set(false);
          this.isError.set(false);
          this.message.set(`User ${user.email} created.`);
          this.users.update((list) => [...list, user]);
          this.form.reset();
        },
        error: (err) => {
          this.saving.set(false);
          this.isError.set(true);
          this.message.set(err?.error?.message ?? "Could not create user.");
        },
      });
  }

  deactivate(userId: string): void {
    this.tenantsService.deactivateUser(userId).subscribe(() => {
      this.users.update((list) =>
        list.map((u) => (u.id === userId ? { ...u, isActive: false } : u)),
      );
    });
  }
}
