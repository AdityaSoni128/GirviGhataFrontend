import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantsService, Branch } from '../../../core/services/tenants.service';

@Component({
  selector: 'app-branches-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-2xl mx-auto">
      <h2 class="text-xl font-semibold text-brand-900 mb-6">Branches</h2>

      <div class="card mb-6">
        <h3 class="text-sm font-semibold text-gray-600 mb-3">Add Branch</h3>
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Code</label>
            <input class="input-field" formControlName="code" placeholder="e.g. MAIN, NORTH" />
          </div>
          <div>
            <label class="label">Name</label>
            <input class="input-field" formControlName="name" />
          </div>
          <div>
            <label class="label">City</label>
            <input class="input-field" formControlName="city" />
          </div>
          <div>
            <label class="label">State</label>
            <input class="input-field" formControlName="state" />
          </div>
          <div class="col-span-2">
            @if (message()) {
              <p class="text-sm mb-2" [class.text-green-700]="!isError()" [class.text-red-600]="isError()">
                {{ message() }}
              </p>
            }
            <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Add Branch' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card !p-0 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-brand-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-2">Code</th>
              <th class="px-4 py-2">Name</th>
            </tr>
          </thead>
          <tbody>
            @for (b of branches(); track b.id) {
              <tr class="border-t border-gray-100">
                <td class="px-4 py-2 font-mono text-xs">{{ b.code }}</td>
                <td class="px-4 py-2">{{ b.name }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class BranchesSettingsComponent implements OnInit {
  readonly branches = signal<Branch[]>([]);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly tenantsService: TenantsService,
  ) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      city: [''],
      state: [''],
    });
  }

  ngOnInit(): void {
    this.tenantsService.listBranches().subscribe((b) => this.branches.set(b));
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set(null);

    const value = this.form.getRawValue();
    this.tenantsService
      .createBranch({
        code: value.code!,
        name: value.name!,
        city: value.city || undefined,
        state: value.state || undefined,
      })
      .subscribe({
        next: (branch) => {
          this.saving.set(false);
          this.isError.set(false);
          this.message.set('Branch created.');
          this.branches.update((list) => [...list, branch]);
          this.form.reset();
        },
        error: (err) => {
          this.saving.set(false);
          this.isError.set(true);
          this.message.set(err?.error?.message ?? 'Could not create branch.');
        },
      });
  }
}
