import type { ReactNode } from "react";
import { Check, Clock, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONES, type Tone } from "./tones";

interface StatusConfig {
  label: string;
  tone: Tone;
  icon?: ReactNode;
}

const ICONS = {
  ok: <Check size={12} aria-hidden="true" />,
  wait: <Clock size={12} aria-hidden="true" />,
  info: <Info size={12} aria-hidden="true" />,
  warn: <TriangleAlert size={12} aria-hidden="true" />,
};

// One map from a status string to its label, tone and icon. Add new statuses here, never inline.
const STATUS: Record<string, StatusConfig> = {
  active: { label: "Active", tone: "success", icon: ICONS.ok },
  verified: { label: "Verified", tone: "success", icon: ICONS.ok },
  sent: { label: "Sent", tone: "success", icon: ICONS.ok },
  approved: { label: "Approved", tone: "success", icon: ICONS.ok },
  queued: { label: "Queued", tone: "accent", icon: ICONS.wait },
  pending: { label: "Pending", tone: "accent", icon: ICONS.wait },
  retrying: { label: "Retrying", tone: "accent", icon: ICONS.wait },
  processing: { label: "In progress", tone: "info", icon: ICONS.info },
  failed: { label: "Failed", tone: "danger", icon: ICONS.warn },
  rejected: { label: "Rejected", tone: "danger", icon: ICONS.warn },
  inactive: { label: "Inactive", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  system: { label: "System", tone: "neutral" },
};

interface StatusBadgeProps {
  status: string;
  /** Override the default label. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = STATUS[status] ?? { label: status, tone: "neutral" as Tone };
  const t = TONES[cfg.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        t.bg,
        t.fg,
        cfg.tone === "neutral" && "ring-1 ring-line",
        className,
      )}
    >
      {cfg.icon}
      {label ?? cfg.label}
    </span>
  );
}
