import * as React from "react";

import { cn } from "@/lib/utils";

// Filled sand well with a visible border, so the 3:1 input-border contrast rule still holds.
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-line-strong bg-surface-sunken px-3 py-2 text-sm text-ink transition-colors duration-150 placeholder:text-ink-muted focus-visible:border-focus focus-visible:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
