import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeId } from '../../../core/models/theme.model';

/**
 * Compact theme selector — a single radiogroup of switch-style rows
 * (swatch + name + toggle), NOT six separate buttons. Only one row can
 * be "on" at a time by construction: selecting any row calls
 * ThemeService.setTheme(), which is the sole source of truth for the
 * active theme.
 *
 * Colors here are written to be legible specifically against the light
 * `bg-surface` popover panel that now always hosts this component (see
 * ThemeMenuComponent) — explicit text/background/border tokens rather
 * than the previous bg-white/opacity overlays, which were tuned for a
 * dark sidebar background and became low-contrast/invisible once moved
 * into a light popover.
 *
 * Accessibility: proper radiogroup/radio roles (not just a visual
 * toggle), full keyboard support (Tab into the group, Arrow keys to
 * move, Enter/Space to select), and the active row is marked with both
 * a checkmark AND a text state — never color alone.
 */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div role="radiogroup" aria-label="Theme" class="space-y-1">
      @for (t of themeService.themes; track t.id; let i = $index) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="themeService.activeTheme() === t.id"
          [id]="'theme-option-' + t.id"
          [tabindex]="themeService.activeTheme() === t.id ? 0 : -1"
          (click)="select(t.id)"
          (keydown)="onKeydown($event, i)"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          [class.bg-brand-50]="themeService.activeTheme() === t.id"
          [class.border]="themeService.activeTheme() === t.id"
          [class.border-brand-200]="themeService.activeTheme() === t.id"
          [class.hover:bg-surface-hover]="themeService.activeTheme() !== t.id"
        >
          <!-- swatch preview -->
          <span class="flex shrink-0 rounded-full overflow-hidden w-4 h-4 border border-black/10">
            <span class="w-1/3 h-full" [style.backgroundColor]="t.preview.sidebar"></span>
            <span class="w-1/3 h-full" [style.backgroundColor]="t.preview.primary"></span>
            <span class="w-1/3 h-full" [style.backgroundColor]="t.preview.accent"></span>
          </span>

          <span class="flex-1 truncate">{{ t.label }}</span>

          <!-- switch -->
          <span
            class="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors"
            [class.bg-gold-500]="themeService.activeTheme() === t.id"
            [class.border-gold-600]="themeService.activeTheme() === t.id"
            [class.bg-brand-100]="themeService.activeTheme() !== t.id"
            [class.border-brand-300]="themeService.activeTheme() !== t.id"
          >
            <span
              class="inline-block h-3 w-3 transform rounded-full bg-white border border-black/10 shadow-sm transition-transform"
              [class.translate-x-3.5]="themeService.activeTheme() === t.id"
              [class.translate-x-0.5]="themeService.activeTheme() !== t.id"
            ></span>
          </span>

          @if (themeService.activeTheme() === t.id) {
            <span class="sr-only">(active)</span>
          }
        </button>
      }
    </div>
  `,
})
export class ThemeSwitcherComponent {
  constructor(readonly themeService: ThemeService) {}

  select(id: ThemeId): void {
    this.themeService.setTheme(id);
  }

  /** Roving-tabindex arrow-key navigation for the radiogroup pattern. */
  onKeydown(event: KeyboardEvent, index: number): void {
    const themes = this.themeService.themes;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = themes[(index + 1) % themes.length];
      this.select(next.id);
      this.focusOption(next.id);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const prev = themes[(index - 1 + themes.length) % themes.length];
      this.select(prev.id);
      this.focusOption(prev.id);
    }
  }

  private focusOption(id: ThemeId): void {
    document.getElementById(`theme-option-${id}`)?.focus();
  }
}