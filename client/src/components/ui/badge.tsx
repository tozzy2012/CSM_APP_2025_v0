import * as React from "react";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "danger";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";
    const variants: Record<string, string> = {
      default:
        "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
      secondary:
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline:
        "border-border text-foreground bg-background hover:bg-muted",
      success:
        "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
      danger:
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };

    return (
      <div
        ref={ref}
        className={cn(base, variants[variant] ?? variants.default, className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
