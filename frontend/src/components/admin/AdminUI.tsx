import type { ReactNode } from "react";
import { Check, Info, TriangleAlert } from "lucide-react";
import { FormError } from "@/components/auth/AuthShell";
import { PageHeader as SharedPageHeader } from "@/components/shared/PageHeader";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { TONES } from "@/components/shared/tones";
import { cn } from "@/lib/utils";

// Adapters kept so admin pages keep their existing API. The real components live in components/shared.

/** Title row at the top of an admin page, with optional action buttons on the right. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return <SharedPageHeader eyebrow="Admin" title={title} subtitle={description} action={actions} />;
}

/** Previous / next controls for a paged list. */
export function Pager(props: { page: number; limit: number; total: number; onChange: (page: number) => void }) {
  return <DataTablePagination {...props} />;
}

/** Skeleton / error banner / empty message shown in place of a table body. */
export function ListState({
  loading,
  error,
  empty,
  emptyText = "Nothing to show here yet.",
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-9 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4">
        <FormError message={error} />
      </div>
    );
  }
  if (empty) {
    return <p className="py-12 text-center text-sm text-ink-muted">{emptyText}</p>;
  }
  return null;
}

type PillTone = "green" | "gray" | "red" | "amber" | "blue";

const PILL: Record<PillTone, { tone: keyof typeof TONES; icon?: ReactNode }> = {
  green: { tone: "success", icon: <Check size={12} aria-hidden="true" /> },
  gray: { tone: "neutral" },
  red: { tone: "danger", icon: <TriangleAlert size={12} aria-hidden="true" /> },
  amber: { tone: "accent", icon: <TriangleAlert size={12} aria-hidden="true" /> },
  blue: { tone: "info", icon: <Info size={12} aria-hidden="true" /> },
};

/** Small status label. Colour, icon and words together, never colour alone. */
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const cfg = PILL[tone];
  const t = TONES[cfg.tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        t.bg,
        t.fg,
        cfg.tone === "neutral" && "ring-1 ring-line",
      )}
    >
      {cfg.icon}
      {children}
    </span>
  );
}
