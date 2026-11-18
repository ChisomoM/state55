import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionBodyProps {
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyText?: string;
  skeletonClassName?: string;
  children?: ReactNode;
}

/** Loading, error (with retry) and empty handling for any card body, so one failure never blanks a page. */
export function SectionBody({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyText = "Nothing to show here yet.",
  skeletonClassName = "h-40 w-full",
  children,
}: SectionBodyProps) {
  if (isLoading) return <div className={`skeleton ${skeletonClassName}`} aria-busy="true" aria-label="Loading" />;
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 py-8 text-center">
        <TriangleAlert size={20} className="text-danger" aria-hidden="true" />
        <p className="text-sm text-ink-muted">We could not load this section. {error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  if (isEmpty) return <p className="py-8 text-center text-sm text-ink-muted">{emptyText}</p>;
  return <>{children}</>;
}
