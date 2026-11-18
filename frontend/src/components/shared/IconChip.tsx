import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONES, type Tone } from "./tones";

interface IconChipProps {
  icon: ReactNode;
  tone?: Tone;
  /** sm 32px, md 40px, lg 48px */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "h-8 w-8 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-12 w-12 rounded-xl" };

/** Icon on a soft tinted square. The most repeated "polish" element in the product. */
export function IconChip({ icon, tone = "brand", size = "md", className }: IconChipProps) {
  const t = TONES[tone];
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex flex-shrink-0 items-center justify-center", SIZES[size], t.bg, t.fg, className)}
    >
      {icon}
    </span>
  );
}
