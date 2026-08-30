/** @type {import('tailwindcss').Config} */
module.exports = {
  // Binary light/dark mode is retired in favor of the 6-theme,
  // CSS-variable-driven system below (see styles.css / ThemeService).
  // `brand`/`gold` and the new semantic tokens all resolve through
  // `rgb(var(--token) / <alpha-value>)`, so every existing component
  // using e.g. bg-brand-900, text-brand-800, border-brand-100 re-themes
  // automatically the moment [data-theme] changes on <html> — no
  // per-component edits needed. Adding a 7th theme later means adding
  // one new `[data-theme="..."]` block in styles.css; nothing here or
  // in any component changes.
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        gold: {
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          500: 'rgb(var(--gold-500) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
        },
        // Named semantic tokens per Section 3 of the spec — available as
        // e.g. bg-surface, text-text-muted, border-border, bg-sidebar.
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--surface-hover) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        sidebar: 'rgb(var(--sidebar) / <alpha-value>)',
        'sidebar-text': 'rgb(var(--sidebar-text) / <alpha-value>)',
        'input-bg': 'rgb(var(--input-bg) / <alpha-value>)',
        'table-header': 'rgb(var(--table-header) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};