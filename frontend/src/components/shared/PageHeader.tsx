import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small capitals line above the title: the kind of page. */
  eyebrow?: string;
  /** Right-hand actions. At most one primary button. */
  action?: ReactNode;
  hasBack?: boolean;
  className?: string;
}

export function PageHeader({ title, subtitle, eyebrow, action, hasBack, className }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8", className)}>
      <div className="flex min-w-0 items-end gap-3">
        {hasBack && (
          <Button variant="outline" size="icon" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" />
          </Button>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="label mb-1">{eyebrow}</p>}
          <h1 className="font-display text-display-sm font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
