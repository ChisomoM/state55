import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconChip } from "./IconChip";

interface EmptyStateProps {
  icon?: ReactNode;
  /** What this place is for. */
  title: string;
  /** One sentence, then the action. */
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex flex-col items-center gap-3 py-14 text-center", className)}
    >
      {icon && <IconChip icon={icon} tone="neutral" size="lg" />}
      <div className="space-y-1">
        <p className="font-display text-base font-bold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-xs text-sm text-ink-muted">{description}</p>}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
