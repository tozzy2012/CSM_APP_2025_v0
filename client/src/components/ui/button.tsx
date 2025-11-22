import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-2 border border-transparent cursor-pointer";
    const variants: Record<string, string> = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border-gray-300 bg-white hover:bg-gray-50",
      ghost: "bg-transparent hover:bg-gray-100",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    };
    const sizes: Record<string, string> = {
      sm: "text-xs px-2 py-1",
      md: "text-sm px-3 py-2",
      lg: "text-base px-4 py-2",
    };

    const cls = [base, variants[variant], sizes[size], className]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={cls} {...props} />;
  }
);
Button.displayName = "Button";
