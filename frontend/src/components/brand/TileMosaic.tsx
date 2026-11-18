import { Tile } from "./WeaveBand";

interface TileMosaicProps {
  cols?: number;
  rows?: number;
  offset?: number;
  gap?: number;
  className?: string;
}

/** Whole tiles in a stepped grid (two places per row, like a loom repeat). One per view, faded into Earth behind text. */
export function TileMosaic({ cols = 6, rows = 8, offset = 0, gap = 1.5, className = "" }: TileMosaicProps) {
  const W = cols * (24 + gap) - gap;
  const H = rows * (24 + gap) - gap;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={className}>
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <Tile key={`${r}-${c}`} i={c + r * 2 + offset} x={c * (24 + gap)} y={r * (24 + gap)} seam={false} />
        )),
      )}
    </svg>
  );
}
