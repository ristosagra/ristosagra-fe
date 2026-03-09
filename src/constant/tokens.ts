// ─────────────────────────────────────────────────────────────
// constants/tokens.ts
// Tutti i token del design system come riferimenti a CSS variables.
// Usali con style={{ color: tokens.text.primary }}
// ─────────────────────────────────────────────────────────────

const v = (name: string) => `var(--${name})`;

export const tokens = {
  bg: {
    base: v("bg-base"),
    surface: v("bg-surface"),
    raised: v("bg-raised"),
    overlay: v("bg-overlay"),
    hover: v("bg-hover"),
  },
  brand: {
    default: v("brand"),
    dim: v("brand-dim"),
    glow: v("brand-glow"),
    subtle: v("brand-subtle"),
  },
  text: {
    colored: v("text-colored"),
    primary: v("text-primary"),
    secondary: v("text-secondary"),
    muted: v("text-muted"),
    inverse: v("text-inverse"),
  },
  border: {
    default: v("border"),
    medium: v("border-medium"),
    brand: v("border-brand"),
  },
  semantic: {
    success: v("success"),
    successBg: v("success-bg"),
    danger: v("danger"),
    dangerBg: v("danger-bg"),
    info: v("info"),
    infoBg: v("info-bg"),
  },
  shadow: {
    sm: v("shadow-sm"),
    md: v("shadow-md"),
    lg: v("shadow-lg"),
    brand: v("shadow-brand"),
  },
  font: {
    display: v("font-display"),
    body: v("font-body"),
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "22px",
    full: "9999px",
  },
} as const;
