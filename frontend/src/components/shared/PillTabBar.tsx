import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PillTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface PillTabBarProps<T extends string> {
  tabs: readonly PillTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel?: string;
  /** Unique per bar on a page so the sliding pills do not collide. */
  layoutId?: string;
}

/** Segmented tabs on a sand track, with a white pill that slides to the active tab. */
export function PillTabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
  ariaLabel = "Sections",
  layoutId = "pill-tab-active",
}: PillTabBarProps<T>) {
  const reduce = useReducedMotion();
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("inline-flex gap-0.5 overflow-x-auto rounded-xl bg-surface-sunken p-1", className)}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-surface-raised shadow-1"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            {Icon && <Icon size={14} className="relative z-10" aria-hidden="true" />}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
