export const ThemeVariants = {
  colors: {
    text: {
      brand: "text-[var(--brand)]",
      secondary: "text-[var(--text-secondary)]",
      white: "text-[var(--text-primary)]",
    },
    bg: {
      brand: "bg-[var(--bg-brand)]",
      base: "bg-[var(--bg-base)]",
      surface: "bg-[var(--bg-surface)]",
      hover: "bg-[var(--bg-hover)]",
      overlay: "bg-[var(--bg-overlay)]",
      trasparent: "bg-transparent",
    },
    border: {
      all: {
        brand: "border border-[var(--border-brand)]",
        default: "border border-[var(--border)]",
      },
      top: {
        default: "border-t border-t-[var(--border)]",
      },
      bottom: {
        default: "border-b border-b-[var(--border)]",
      },
    },
  },
  fontFamily: {
    display: "font-[var(--font-display)]",
  },
  borderRadius: {
    sm: "rounded-[6px]",
    md: "rounded-[10px]",
    lg: "rounded-[16px]",
    xl: "rounded-[22px]",
    full: "rounded-full",
  },
  raw: {
    brand: "var(--brand)",
    textPrimary: "var(--text-primary)",
    textSecondary: "var(--text-secondary)",
    danger: "var(--danger)",
  },
} as const;
