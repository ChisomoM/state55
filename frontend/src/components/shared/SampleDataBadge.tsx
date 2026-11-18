import { FlaskConical } from "lucide-react";

/** Marks a figure or chart as illustrative. Never use it next to real system data. */
export function SampleDataBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong">
      <FlaskConical size={12} aria-hidden="true" />
      Sample data
    </span>
  );
}
