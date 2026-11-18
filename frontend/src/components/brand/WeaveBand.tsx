import { useId } from "react";

const C = {
  clay: "#B5381F",
  ochre: "#E0A030",
  baobab: "#1F6B45",
  sand: "#F5EDE0",
  lake: "#0D6B64",
  earth: "#1E1410",
};

interface TileDef {
  bg: string;
  line: string;
  d: string;
  fill?: string;
}

// The five tiles, always in this order: clay chevron, ochre triangle, baobab spiral, sand diamond, lake zigzag.
export const TILES: TileDef[] = [
  { bg: C.clay, line: C.sand, d: "M3 10 L12 4 L21 10 M3 19 L12 13 L21 19" },
  { bg: C.ochre, line: C.earth, d: "M12 4 L20.5 19.5 H3.5 Z", fill: "M12 11.5 L15.5 17.5 H8.5 Z" },
  { bg: C.baobab, line: C.sand, d: "M5 19 V5 H19 V19 H9 V9 H15 V15 H12" },
  { bg: C.sand, line: C.earth, d: "M12 3.5 L20.5 12 L12 20.5 L3.5 12 Z", fill: "M12 9 L15 12 L12 15 L9 12 Z" },
  {
    bg: C.lake,
    line: C.sand,
    d: "M3 8.5 L7.5 4.5 L12 8.5 L16.5 4.5 L21 8.5 M3 14 L7.5 10 L12 14 L16.5 10 L21 14 M3 19.5 L7.5 15.5 L12 19.5 L16.5 15.5 L21 19.5",
  },
];

export function Tile({ i, x = 0, y = 0, seam = true }: { i: number; x?: number; y?: number; seam?: boolean }) {
  const t = TILES[i % 5];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="24" height="24" fill={t.bg} />
      <path d={t.d} fill="none" stroke={t.line} strokeWidth="2" strokeLinejoin="miter" />
      {t.fill && <path d={t.fill} fill={t.line} />}
      {seam && <rect x="23" width="1" height="24" fill={C.earth} />}
    </g>
  );
}

interface WeaveBandProps {
  /** "weave" for 16px and up, "thread" (plain colour segments) under 16px. */
  variant?: "weave" | "thread";
  height?: number;
  /** Swaps the thread's earth segment to sand so it stays visible on dark grounds. */
  onDark?: boolean;
  className?: string;
}

export function WeaveBand({ variant = "weave", height, onDark = false, className = "" }: WeaveBandProps) {
  const id = useId().replace(/:/g, "");

  if (variant === "thread") {
    const h = height ?? 6;
    const u = h * 4;
    const cols = [C.clay, C.ochre, C.baobab, onDark ? C.sand : C.earth, C.lake];
    return (
      <svg aria-hidden="true" width="100%" height={h} className={`block ${className}`}>
        <defs>
          <pattern id={`t${id}`} width={u * 5} height={h} patternUnits="userSpaceOnUse">
            {cols.map((c, i) => (
              <rect key={i} x={i * u} width={u} height={h} fill={c} />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height={h} fill={`url(#t${id})`} />
      </svg>
    );
  }

  const h = height ?? 24;
  return (
    <svg aria-hidden="true" width="100%" height={h} className={`block ${className}`}>
      <defs>
        <pattern
          id={`w${id}`}
          width="120"
          height="24"
          patternUnits="userSpaceOnUse"
          patternTransform={`scale(${h / 24})`}
        >
          {TILES.map((_, i) => (
            <Tile key={i} i={i} x={i * 24} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={h} fill={`url(#w${id})`} />
    </svg>
  );
}
