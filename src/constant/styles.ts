// ─────────────────────────────────────────────────────────────
// constants/styles.ts
// Oggetti di stile pronti per ogni componente.
// Uso: style={styles.btn.primary}
// ─────────────────────────────────────────────────────────────

import type { CSSProperties } from "react";
import { tokens } from "./tokens";

// ── Utility type ──────────────────────────────────────────────
type S = CSSProperties;

// ── Base condivisa ────────────────────────────────────────────
const base: S = {
  fontFamily: tokens.font.body,
  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
};

// ═════════════════════════════════════════════════════════════
// LAYOUT
// ═════════════════════════════════════════════════════════════
export const layout = {
  page: {
    background: tokens.bg.base,
    color: tokens.text.primary,
    fontFamily: tokens.font.body,
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  } satisfies S,

  surface: {
    background: tokens.bg.surface,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.lg,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// NAVBAR
// ═════════════════════════════════════════════════════════════
export const navbar = {
  root: {
    background: tokens.bg.surface,
    borderBottom: `1px solid ${tokens.border.default}`,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    flexShrink: 0,
  } satisfies S,

  brand: {
    fontFamily: tokens.font.display,
    fontSize: 20,
    color: tokens.brand.default,
    display: "flex",
    alignItems: "center",
    gap: 8,
  } satisfies S,

  brandSpan: {
    color: tokens.text.primary,
  } satisfies S,

  navLink: {
    ...base,
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text.secondary,
    padding: "6px 14px",
    borderRadius: tokens.radius.md,
    cursor: "pointer",
    border: "none",
    background: "transparent",
  } satisfies S,

  navLinkActive: {
    color: tokens.brand.default,
    background: tokens.brand.subtle,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// BUTTONS
// ═════════════════════════════════════════════════════════════
const btnBase: S = {
  ...base,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontFamily: tokens.font.body,
  fontSize: 13,
  fontWeight: 500,
  border: "none",
  borderRadius: tokens.radius.md,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const btn = {
  // Varianti
  primary: {
    ...btnBase,
    background: tokens.brand.default,
    color: "#fff",
    boxShadow: tokens.shadow.brand,
    height: 36,
    padding: "0 16px",
  } satisfies S,

  secondary: {
    ...btnBase,
    background: tokens.bg.raised,
    color: tokens.text.primary,
    border: `1px solid ${tokens.border.medium}`,
    height: 36,
    padding: "0 16px",
  } satisfies S,

  ghost: {
    ...btnBase,
    background: "transparent",
    color: tokens.text.secondary,
    border: `1px solid transparent`,
    height: 36,
    padding: "0 16px",
  } satisfies S,

  danger: {
    ...btnBase,
    background: tokens.semantic.dangerBg,
    color: tokens.semantic.danger,
    border: `1px solid rgba(217,95,95,0.25)`,
    height: 36,
    padding: "0 16px",
  } satisfies S,

  success: {
    ...btnBase,
    background: tokens.semantic.successBg,
    color: tokens.semantic.success,
    border: `1px solid rgba(61,158,107,0.25)`,
    height: 36,
    padding: "0 16px",
  } satisfies S,

  icon: {
    ...btnBase,
    width: 36,
    height: 36,
    padding: 0,
    background: tokens.bg.raised,
    border: `1px solid ${tokens.border.default}`,
    color: tokens.text.secondary,
  } satisfies S,

  // Dimensioni
  sm: { height: 30, padding: "0 12px", fontSize: 12 } satisfies S,
  md: { height: 36, padding: "0 16px" } satisfies S,
  lg: { height: 42, padding: "0 22px", fontSize: 14 } satisfies S,

  disabled: { opacity: 0.38, cursor: "not-allowed" } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// BADGE
// ═════════════════════════════════════════════════════════════
const badgeBase: S = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 500,
  padding: "2px 9px",
  borderRadius: tokens.radius.full,
  letterSpacing: "0.03em",
};

export const badge = {
  brand: {
    ...badgeBase,
    background: tokens.brand.subtle,
    color: tokens.brand.default,
    border: `1px solid ${tokens.border.brand}`,
  } satisfies S,
  success: {
    ...badgeBase,
    background: tokens.semantic.successBg,
    color: tokens.semantic.success,
    border: "1px solid rgba(61,158,107,0.25)",
  } satisfies S,
  danger: {
    ...badgeBase,
    background: tokens.semantic.dangerBg,
    color: tokens.semantic.danger,
    border: "1px solid rgba(217,95,95,0.25)",
  } satisfies S,
  info: {
    ...badgeBase,
    background: tokens.semantic.infoBg,
    color: tokens.semantic.info,
    border: "1px solid rgba(91,143,217,0.25)",
  } satisfies S,
  neutral: {
    ...badgeBase,
    background: tokens.bg.overlay,
    color: tokens.text.secondary,
    border: `1px solid ${tokens.border.default}`,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// INPUT
// ═════════════════════════════════════════════════════════════
export const input = {
  label: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: tokens.text.muted,
    display: "block",
    marginBottom: 6,
  } satisfies S,

  field: {
    height: 38,
    background: tokens.bg.raised,
    border: `1px solid ${tokens.border.medium}`,
    borderRadius: tokens.radius.md,
    padding: "0 14px",
    fontFamily: tokens.font.body,
    fontSize: 13,
    color: tokens.text.primary,
    width: "100%",
    transition: "all 0.15s",
  } satisfies S,

  fieldFocus: {
    borderColor: tokens.brand.default,
    boxShadow: `0 0 0 3px ${tokens.brand.glow}`,
    background: tokens.bg.overlay,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// CARD
// ═════════════════════════════════════════════════════════════
export const card = {
  root: {
    background: tokens.bg.surface,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    boxShadow: tokens.shadow.sm,
    transition: "all 0.2s",
  } satisfies S,

  body: { padding: 16 } satisfies S,

  footer: {
    padding: "12px 16px",
    borderTop: `1px solid ${tokens.border.default}`,
    background: tokens.bg.raised,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// DISH (menu)
// ═════════════════════════════════════════════════════════════
export const dish = {
  card: {
    background: tokens.bg.surface,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.lg,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    transition: "all 0.18s",
    boxShadow: tokens.shadow.sm,
  } satisfies S,

  name: {
    fontWeight: 500,
    color: tokens.text.primary,
    fontSize: 14,
  } satisfies S,

  desc: {
    fontSize: 12,
    color: tokens.text.muted,
    marginTop: 2,
  } satisfies S,

  price: {
    fontFamily: tokens.font.display,
    fontSize: 16,
    color: tokens.brand.default,
    whiteSpace: "nowrap",
  } satisfies S,

  qtyCtrl: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: tokens.bg.overlay,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.md,
    padding: "4px 6px",
  } satisfies S,

  qtyBtn: {
    width: 22,
    height: 22,
    border: "none",
    borderRadius: tokens.radius.sm,
    background: "transparent",
    color: tokens.text.secondary,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.1s",
  } satisfies S,

  qtyNum: {
    fontWeight: 600,
    fontSize: 13,
    minWidth: 18,
    textAlign: "center",
    color: tokens.text.primary,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// ORDER (cassa)
// ═════════════════════════════════════════════════════════════
export const order = {
  card: {
    background: tokens.bg.surface,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    boxShadow: tokens.shadow.sm,
  } satisfies S,

  cardPaid: {
    background: tokens.bg.raised,
    borderColor: "rgba(61,158,107,0.2)",
  } satisfies S,

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    gap: 12,
    cursor: "pointer",
  } satisfies S,

  number: {
    fontFamily: tokens.font.display,
    fontSize: 20,
    color: tokens.brand.default,
  } satisfies S,

  total: {
    fontSize: 14,
    fontWeight: 600,
    color: tokens.text.primary,
    marginLeft: "auto",
    marginRight: 12,
  } satisfies S,

  body: {
    borderTop: `1px solid ${tokens.border.default}`,
    padding: "12px 16px 16px",
  } satisfies S,

  line: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderTop: `1px solid ${tokens.border.default}`,
  } satisfies S,

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTop: `1px solid ${tokens.border.medium}`,
  } satisfies S,

  totalValue: {
    fontFamily: tokens.font.display,
    fontSize: 18,
    color: tokens.brand.default,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// CART / RIEPILOGO
// ═════════════════════════════════════════════════════════════
export const cart = {
  root: {
    background: tokens.bg.surface,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.xl,
    overflow: "hidden",
    boxShadow: tokens.shadow.md,
  } satisfies S,

  header: {
    padding: "16px 20px",
    borderBottom: `1px solid ${tokens.border.default}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } satisfies S,

  title: {
    fontFamily: tokens.font.display,
    fontSize: 17,
    color: tokens.text.primary,
  } satisfies S,

  body: {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  } satisfies S,

  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    borderRadius: tokens.radius.md,
    background: tokens.bg.raised,
  } satisfies S,

  footer: {
    padding: "14px 20px",
    borderTop: `1px solid ${tokens.border.default}`,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  } satisfies S,

  totalValue: {
    fontFamily: tokens.font.display,
    fontSize: 22,
    color: tokens.brand.default,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// MODAL
// ═════════════════════════════════════════════════════════════
export const modal = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  } satisfies S,

  root: {
    background: tokens.bg.surface,
    border: `1px solid ${tokens.border.medium}`,
    borderRadius: tokens.radius.xl,
    padding: 28,
    width: 360,
    boxShadow: tokens.shadow.lg,
  } satisfies S,

  title: {
    fontFamily: tokens.font.display,
    fontSize: 20,
    color: tokens.text.primary,
    marginBottom: 4,
  } satisfies S,

  subtitle: {
    fontSize: 12,
    color: tokens.text.muted,
    marginBottom: 20,
  } satisfies S,

  icon: {
    width: 44,
    height: 44,
    background: tokens.semantic.successBg,
    border: "1px solid rgba(61,158,107,0.3)",
    borderRadius: tokens.radius.lg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    marginBottom: 16,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// SIDEBAR
// ═════════════════════════════════════════════════════════════
export const sidebar = {
  root: {
    background: tokens.bg.surface,
    borderRight: `1px solid ${tokens.border.default}`,
    padding: "16px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flexShrink: 0,
    overflowY: "auto",
  } satisfies S,

  sectionLabel: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: tokens.text.muted,
    padding: "8px 10px 6px",
  } satisfies S,

  btn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 12px",
    borderRadius: tokens.radius.md,
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text.secondary,
    cursor: "pointer",
    transition: "all 0.12s",
    border: "1px solid transparent",
    background: "transparent",
    fontFamily: tokens.font.body,
    width: "100%",
    textAlign: "left",
  } satisfies S,

  btnActive: {
    background: tokens.brand.subtle,
    color: tokens.brand.default,
    borderColor: tokens.border.brand,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// TOAST
// ═════════════════════════════════════════════════════════════
const toastBase: S = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 18px",
  borderRadius: tokens.radius.full,
  fontSize: 13,
  fontWeight: 500,
  boxShadow: tokens.shadow.lg,
  position: "fixed",
  top: 20,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 100,
  whiteSpace: "nowrap",
};

export const toast = {
  ok: {
    ...toastBase,
    background: tokens.semantic.successBg,
    color: tokens.semantic.success,
    border: "1px solid rgba(61,158,107,0.3)",
  } satisfies S,
  err: {
    ...toastBase,
    background: tokens.semantic.dangerBg,
    color: tokens.semantic.danger,
    border: "1px solid rgba(217,95,95,0.3)",
  } satisfies S,
  info: {
    ...toastBase,
    background: tokens.semantic.infoBg,
    color: tokens.semantic.info,
    border: "1px solid rgba(91,143,217,0.25)",
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// STAT PILL
// ═════════════════════════════════════════════════════════════
export const stat = {
  pill: {
    background: tokens.bg.raised,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: tokens.radius.md,
    padding: "8px 14px",
    textAlign: "center",
    minWidth: 72,
    boxShadow: tokens.shadow.sm,
  } satisfies S,

  value: {
    fontFamily: tokens.font.display,
    fontSize: 22,
    lineHeight: 1,
  } satisfies S,

  label: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: tokens.text.muted,
    marginTop: 2,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// TYPOGRAPHY helpers
// ═════════════════════════════════════════════════════════════
export const typography = {
  display: {
    fontFamily: tokens.font.display,
    fontSize: 36,
    color: tokens.text.primary,
    lineHeight: 1.1,
  } satisfies S,

  displayItalic: {
    fontFamily: tokens.font.display,
    fontSize: 36,
    fontStyle: "italic",
    color: tokens.brand.default,
    lineHeight: 1.1,
  } satisfies S,

  h1: {
    fontFamily: tokens.font.display,
    fontSize: 24,
    color: tokens.text.primary,
  } satisfies S,

  h2: {
    fontSize: 18,
    fontWeight: 600,
    color: tokens.text.primary,
  } satisfies S,

  body: {
    fontSize: 14,
    color: tokens.text.secondary,
    lineHeight: 1.6,
  } satisfies S,

  caption: {
    fontSize: 11,
    letterSpacing: "0.08em",
    color: tokens.text.muted,
    textTransform: "uppercase",
  } satisfies S,

  price: {
    fontFamily: tokens.font.display,
    fontSize: 16,
    color: tokens.brand.default,
  } satisfies S,
};

// ═════════════════════════════════════════════════════════════
// TOGGLE
// ═════════════════════════════════════════════════════════════
export const toggle = {
  track: (on: boolean): S => ({
    width: 40,
    height: 22,
    background: on ? tokens.brand.default : tokens.bg.overlay,
    border: `1px solid ${on ? tokens.brand.default : tokens.border.medium}`,
    borderRadius: tokens.radius.full,
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
    flexShrink: 0,
  }),

  thumb: (on: boolean): S => ({
    width: 16,
    height: 16,
    background: "white",
    borderRadius: tokens.radius.full,
    position: "absolute",
    top: 2,
    left: on ? 20 : 2,
    transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  }),
};

// ═════════════════════════════════════════════════════════════
// DIVIDER
// ═════════════════════════════════════════════════════════════
export const divider: S = {
  height: 1,
  background: tokens.border.default,
  margin: "8px 0",
};
