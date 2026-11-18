import { cn } from "@/lib/utils";

// Small dependency-free charts. Colours come from the brand tokens, motion is CSS only, and every
// chart carries a text alternative (aria-label plus native tooltips) so it is not colour or sight only.

export interface ColumnDatum {
  label: string;
  value: number;
}

/** Vertical columns with a baseline and sparse x labels. */
export function ColumnChart({
  data,
  height = 168,
  ariaLabel,
  className,
}: {
  data: ColumnDatum[];
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 10 ? 2 : 1;

  return (
    <div role="img" aria-label={ariaLabel} className={cn("w-full", className)}>
      <div className="relative flex items-end gap-1.5 border-b border-line" style={{ height }}>
        {/* faint guides at 50% and 100% */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end" title={`${d.label}: ${d.value}`}>
            <div
              className="w-full rounded-t-md bg-brand transition-opacity duration-150 group-hover:opacity-80"
              style={{ height: `${Math.max(d.value === 0 ? 0 : 4, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
        <span className="absolute -top-5 left-0 font-mono text-[11px] text-ink-muted">{max}</span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 truncate text-center text-[11px] text-ink-muted">
            {i % step === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  /** Optional right-hand note, for example a percentage. */
  note?: string;
}

/** Horizontal bars with the label on top and the number on the right. Reads well at any width. */
export function BarList({ data, className }: { data: BarDatum[]; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={cn("space-y-3.5", className)}>
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-ink">{d.label}</span>
            <span className="flex-shrink-0 font-mono text-xs tabular-nums text-ink-muted">
              {d.value}
              {d.note ? ` · ${d.note}` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-spring"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export interface SegmentDatum {
  label: string;
  value: number;
  /** Tailwind background class, for example "bg-success". */
  colour: string;
}

/** One stacked bar showing how a total splits, with a legend underneath. */
export function SegmentedBar({ data, className }: { data: SegmentDatum[]; className?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className={className}>
      <div
        role="img"
        aria-label={data.map((d) => `${d.label} ${d.value}`).join(", ")}
        className="flex h-3 overflow-hidden rounded-full bg-surface-sunken"
      >
        {total > 0 &&
          data
            .filter((d) => d.value > 0)
            .map((d) => (
              <div
                key={d.label}
                className={cn("h-full border-r-2 border-surface-raised last:border-r-0", d.colour)}
                style={{ width: `${(d.value / total) * 100}%` }}
                title={`${d.label}: ${d.value}`}
              />
            ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-ink-muted">
              <span className={cn("h-2.5 w-2.5 rounded-full", d.colour)} aria-hidden="true" />
              {d.label}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-ink">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A filled line chart for a single series. Flat fill, no gradient. */
export function AreaChart({
  values,
  labels,
  height = 150,
  ariaLabel,
  className,
}: {
  values: number[];
  labels?: [string, string];
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const W = 600;
  const H = 150;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * W;
    const y = H - 12 - ((v - min) / span) * (H - 32);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
      >
        <path d={area} fill="var(--brand)" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}
