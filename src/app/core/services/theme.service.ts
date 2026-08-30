import { Injectable, signal } from '@angular/core';
import { DEFAULT_THEME, THEMES, ThemeId } from '../models/theme.model';

const STORAGE_KEY = 'girvi_theme_v2';

/**
 * Applies one of the 6 named themes by setting a `data-theme` attribute
 * on <html> — every theme's CSS custom properties are scoped under a
 * matching `[data-theme="..."]` selector in styles.css. This replaces
 * the previous binary light/dark/system system entirely (that
 * ThemeMode/'dark' class approach is retired — see styles.css).
 *
 * Persists to localStorage so the selection survives refresh, and
 * survives login/logout and route navigation for free since it's a
 * single attribute on the document root rather than per-route state.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes = THEMES;
  readonly activeTheme = signal<ThemeId>(this.readStoredTheme());

  constructor() {
    this.apply(this.activeTheme());
  }

  setTheme(id: ThemeId): void {
    this.activeTheme.set(id);
    localStorage.setItem(STORAGE_KEY, id);
    this.apply(id);
  }

  private readStoredTheme(): ThemeId {
    const stored = localStorage.getItem(STORAGE_KEY);
    const isValid = stored && THEMES.some((t) => t.id === stored);
    return isValid ? (stored as ThemeId) : DEFAULT_THEME;
  }

  private apply(id: ThemeId): void {
    document.documentElement.setAttribute('data-theme', id);
  }
}