import {
  Component,
  ElementRef,
  HostListener,
  Input,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';

/**
 * Compact "Appearance" control: one icon button that opens a popover
 * containing the existing ThemeSwitcherComponent unchanged. This
 * component owns ONLY open/close/positioning/visual chrome — it has no
 * knowledge of themes itself, so ThemeService's state/persistence
 * behavior is untouched.
 *
 * Positioning is computed at open time (and on resize) from the
 * trigger button's actual bounding rect + current viewport size, using
 * `position: fixed`, so the panel is guaranteed to stay fully on-screen
 * regardless of where the trigger sits (sidebar footer vs. mobile
 * header) or how small the viewport is — no reliance on CSS-only
 * flip/anchor classes that assumed a specific layout.
 */
@Component({
  selector: 'app-theme-menu',
  standalone: true,
  imports: [CommonModule, ThemeSwitcherComponent],
  template: `
    <div class="inline-block">
      <button
        #trigger
        type="button"
        (click)="toggle()"
        [attr.aria-expanded]="open()"
        aria-haspopup="true"
        aria-label="Appearance settings"
        title="Appearance"
        class="inline-flex items-center justify-center h-9 w-9 rounded-md text-current opacity-80 hover:opacity-100 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        <!-- palette icon -->
        <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
          <path
            d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8h1.9c2.5 0 4.5-2 4.5-4.5C21 6.4 17 3 12 3Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <circle cx="7.2" cy="12" r="1.2" fill="currentColor" />
          <circle cx="9.2" cy="7.8" r="1.2" fill="currentColor" />
          <circle cx="14.2" cy="7" r="1.2" fill="currentColor" />
          <circle cx="17" cy="10.8" r="1.2" fill="currentColor" />
        </svg>
      </button>

      @if (open()) {
        <div
          [ngStyle]="panelStyle()"
          class="z-50 overflow-y-auto rounded-lg border border-border bg-surface text-text shadow-xl p-2"
          (click)="onPanelClick()"
        >
          <p class="px-1.5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Appearance
          </p>
          <app-theme-switcher></app-theme-switcher>
        </div>
      }
    </div>
  `,
})
export class ThemeMenuComponent {
  /** Hint only, used as a tie-breaker when space above/below is roughly
   * equal — actual placement always self-corrects to whichever side has
   * genuinely more room (see computePosition). */
  @Input() placement: 'top' | 'bottom' = 'bottom';

  @ViewChild('trigger') triggerRef!: ElementRef<HTMLButtonElement>;

  readonly open = signal(false);
  readonly panelStyle = signal<Record<string, string>>({});

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.computePosition();
    }
  }

  /** Selecting a theme closes the popover, matching standard dropdown
   * UX — a click on any option inside the panel bubbles up here.
   * Arrow-key navigation inside the theme switcher does not dispatch a
   * click event, so browsing with the keyboard does not close the menu
   * prematurely; Enter/Space on a focused option does (native button
   * activation), which is the intended "confirm and close" behavior. */
  onPanelClick(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.open()) this.computePosition();
  }

  /**
   * Computes a fixed-position, viewport-clamped placement from the
   * trigger's real bounding rect. Never assumes a fixed panel height —
   * whichever side (above/below) has more actual room wins, and the
   * panel's own maxHeight is capped to that available space with
   * internal scrolling, so it can never be cut off top or bottom no
   * matter how small the viewport is. Horizontal position is clamped
   * the same way, so a trigger near either edge never pushes the panel
   * off-screen.
   */
  private computePosition(): void {
    const btnRect = this.triggerRef.nativeElement.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const panelWidth = Math.min(288, vw - margin * 2);
    let left = btnRect.right - panelWidth;
    left = Math.min(Math.max(left, margin), Math.max(margin, vw - panelWidth - margin));

    const spaceBelow = vh - btnRect.bottom - margin;
    const spaceAbove = btnRect.top - margin;
    const placeBelow = spaceBelow >= spaceAbove;

    const style: Record<string, string> = {
      position: 'fixed',
      left: `${left}px`,
      width: `${panelWidth}px`,
      maxHeight: `${Math.max(120, (placeBelow ? spaceBelow : spaceAbove))}px`,
    };

    if (placeBelow) {
      style['top'] = `${btnRect.bottom + margin}px`;
    } else {
      style['bottom'] = `${vh - btnRect.top + margin}px`;
    }

    this.panelStyle.set(style);
  }
}