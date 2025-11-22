import React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", ...rest }: LabelProps) {
  return (
    <label
      className={
        "block text-sm font-medium text-gray-700 mb-1 " + className
      }
      {...rest}
    />
  );
}
