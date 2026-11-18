import { WeaveBand } from "./WeaveBand";

interface WordmarkProps {
  /** Cap size in px. */
  size?: number;
  /** ink on light grounds, inverse on dark, brand (clay) only on ivory or sand for ceremonial use. */
  tone?: "ink" | "inverse" | "brand";
  band?: boolean;
  descriptor?: string;
  className?: string;
}

/** The logo: MOTHERLAND in Archivo ExtraBold capitals standing on the weave band. There is no symbol. */
export function Wordmark({ size = 32, tone = "ink", band = true, descriptor, className = "" }: WordmarkProps) {
  const color = { ink: "var(--ink)", inverse: "#FBF7F0", brand: "var(--brand)" }[tone];
  const onDark = tone === "inverse";

  return (
    <div
      role="img"
      aria-label="Motherland"
      className={`inline-flex flex-col leading-none ${className}`}
      style={{ fontSize: size, gap: ".22em" }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          letterSpacing: ".14em",
          marginRight: "-.14em",
          color,
          whiteSpace: "nowrap",
        }}
      >
        MOTHERLAND
      </span>
      {band && (
        <div style={{ marginRight: ".14em" }}>
          {size >= 24 ? (
            <WeaveBand height={Math.max(10, Math.round(size * 0.42))} />
          ) : (
            <WeaveBand variant="thread" onDark={onDark} />
          )}
        </div>
      )}
      {descriptor && (
        <span
          aria-hidden="true"
          style={{ fontSize: ".3em", fontWeight: 600, letterSpacing: ".32em", textTransform: "uppercase", color }}
        >
          {descriptor}
        </span>
      )}
    </div>
  );
}
