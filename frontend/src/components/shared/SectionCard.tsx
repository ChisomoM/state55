import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WeaveBand } from "@/components/brand/WeaveBand";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  /** 6px weave thread on top. Only for cards that ARE Motherland. */
  featured?: boolean;
  children: ReactNode;
  className?: string;
  /** Replaces the default p-5 body padding. Use p-0 for edge-to-edge tables. */
  contentClassName?: string;
}

/** The standard white surface: 16px radius, hairline border, soft Earth-tinted shadow that lifts on hover. */
export function SectionCard({ title, subtitle, action, featured, children, className, contentClassName }: SectionCardProps) {
  return (
    <section className={cn("card-elevated overflow-hidden rounded-2xl border border-line bg-surface-raised", className)}>
      {featured && <WeaveBand variant="thread" />}
      {(title || action) && (
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg font-bold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
