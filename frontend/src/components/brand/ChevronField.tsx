interface ChevronFieldProps {
  color?: string;
  opacity?: number;
  pitch?: number;
  className?: string;
}

/** The clay tile's chevron as a quiet repeat texture. Only on Earth or Clay grounds, never behind body text. */
export function ChevronField({ color = "#E0A030", opacity = 0.22, pitch = 28, className = "" }: ChevronFieldProps) {
  const w = 600;
  const h = 320;
  const rows = Math.ceil(h / pitch) + 2;
  const d = Array.from({ length: rows }, (_, r) => {
    const y = r * pitch;
    let p = `M0 ${y + 12}`;
    for (let x = 0; x < w + pitch * 2; x += pitch * 2) p += ` L${x + pitch} ${y} L${x + 2 * pitch} ${y + 12}`;
    return p;
  }).join(" ");

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 h-full w-full ${className}`}
    >
      <path d={d} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="3" strokeLinejoin="miter" />
    </svg>
  );
}
