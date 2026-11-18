export type Tone = "brand" | "accent" | "success" | "info" | "danger" | "neutral";

/** Soft background plus a dark foreground from the same hue. Used for icon chips and badges. */
export const TONES: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: "bg-brand-soft", fg: "text-brand-strong" },
  accent: { bg: "bg-accent-soft", fg: "text-accent-strong" },
  success: { bg: "bg-success-soft", fg: "text-success" },
  info: { bg: "bg-info-soft", fg: "text-info" },
  danger: { bg: "bg-danger-soft", fg: "text-danger" },
  neutral: { bg: "bg-surface-sunken", fg: "text-ink-muted" },
};
