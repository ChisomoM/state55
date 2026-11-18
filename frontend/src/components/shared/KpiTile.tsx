import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IconChip } from "./IconChip";
import type { Tone } from "./tones";

interface KpiTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  /** One line under the value: a trend, a date or a plain note. */
  caption?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/** Vertical KPI tile: label and icon chip on top, big tabular number, caption. */
export function KpiTile({ label, value, icon, tone = "brand", caption, isLoading, className }: KpiTileProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "card-elevated flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface-raised px-5 py-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label">{label}</span>
        {icon && <IconChip icon={icon} tone={tone} size="sm" />}
      </div>
      {isLoading ? (
        <div className="skeleton h-8 w-24" aria-busy="true" aria-label="Loading" />
      ) : (
        <span className="font-display text-display-xs font-bold leading-tight tabular-nums text-ink">{value}</span>
      )}
      {caption && <span className="-mt-1 text-xs leading-snug text-ink-muted">{caption}</span>}
    </motion.div>
  );
}
