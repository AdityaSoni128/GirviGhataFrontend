export type ThemeId =
  | 'royal-gold'
  | 'navy-gold'
  | 'emerald-cream'
  | 'burgundy-champagne'
  | 'slate-indigo'
  | 'warm-ivory';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  /** Small swatch colors for the selector UI preview — not used for
   * anything functional, purely so a user can visually recognize a
   * theme before switching (accessibility: never the ONLY indicator of
   * which theme is active — the switch state and label carry that). */
  preview: { sidebar: string; primary: string; accent: string };
}

/**
 * Single source of truth for the 6 themes — consumed by both
 * ThemeService (persistence/application) and ThemeSwitcherComponent
 * (rendering the selector UI). Adding a 7th theme means adding one
 * entry here plus one matching [data-theme="..."] block in styles.css.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: 'royal-gold',
    label: 'Royal Gold + Charcoal',
    description: 'Premium jewellery default — charcoal sidebar, muted gold accent',
    preview: { sidebar: '#1a1816', primary: '#5c4422', accent: '#d4a832' },
  },
  {
    id: 'navy-gold',
    label: 'Navy + Gold',
    description: 'Banking-inspired — deep navy with gold accent',
    preview: { sidebar: '#081224', primary: '#1e365c', accent: '#cda434' },
  },
  {
    id: 'emerald-cream',
    label: 'Emerald + Cream',
    description: 'Modern and elegant — emerald primary, warm cream surfaces',
    preview: { sidebar: '#184f30', primary: '#216638', accent: '#c8a03c' },
  },
  {
    id: 'burgundy-champagne',
    label: 'Burgundy + Champagne',
    description: 'Traditional luxury jewellery-store feel',
    preview: { sidebar: '#4a161d', primary: '#5e1e26', accent: '#c6a868' },
  },
  {
    id: 'slate-indigo',
    label: 'Slate + Indigo',
    description: 'Modern SaaS dashboard — indigo accent, gold kept subtle',
    preview: { sidebar: '#16192e', primary: '#3c4480', accent: '#b0a480' },
  },
  {
    id: 'warm-ivory',
    label: 'Warm Ivory + Dark Brown',
    description: 'Warm, traditional, easy on the eyes for long hours',
    preview: { sidebar: '#342619', primary: '#47342a', accent: '#c4a25a' },
  },
];

export const DEFAULT_THEME: ThemeId = 'royal-gold';