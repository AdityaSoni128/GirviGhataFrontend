import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-brand-900 px-4"
    >
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-semibold text-gold-400">
            Shree Ram Jwellers
          </h1>
          <p class="text-brand-300 text-sm mt-1">Girvi Ghata Management</p>
        </div>

        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="bg-white rounded-lg shadow-lg p-6 space-y-4"
        >
          <div>
            <label class="label">Email</label>
            <input
              type="email"
              formControlName="email"
              class="input-field"
              autocomplete="username"
            />
          </div>
          <div>
            <label class="label">Password</label>
            <input
              type="password"
              formControlName="password"
              class="input-field"
              autocomplete="current-password"
            />
          </div>

          @if (errorMessage()) {
            <p class="text-sm text-red-600">{{ errorMessage() }}</p>
          }

          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="form.invalid || loading()"
          >
            {{ loading() ? "Signing in…" : "Sign in" }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(["/dashboard"]);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set("Invalid email or password.");
      },
    });
  }
}
