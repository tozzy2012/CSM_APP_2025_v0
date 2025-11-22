import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          "inline-flex h-5 w-9 items-center rounded-full border border-input bg-muted px-0.5 transition-all",
          "peer-checked:bg-primary"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-background shadow transition-transform",
            "peer-checked:translate-x-4"
          )}
        />
      </span>
    </label>
  )
);
Switch.displayName = "Switch";
