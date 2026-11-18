import * as React from "react";
import { cn } from "@/lib/utils";

interface ActionIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  /** Required. Becomes both the aria-label and the tooltip. */
  label: string;
  variant?: "neutral" | "danger" | "brand";
}

const VARIANT = {
  neutral: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "text-ink-muted hover:bg-danger-soft hover:text-danger",
  brand: "text-brand hover:bg-brand-soft hover:text-brand-strong",
};

/** Icon-only row action. Accessible by construction: you cannot render it without a label. */
export const ActionIconButton = React.forwardRef<HTMLButtonElement, ActionIconButtonProps>(
  ({ icon, label, variant = "neutral", className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  ),
);
ActionIconButton.displayName = "ActionIconButton";
