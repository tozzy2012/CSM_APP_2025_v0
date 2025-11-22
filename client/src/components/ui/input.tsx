import React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...rest }: InputProps) {
  return (
    <input
      className={
        "border border-gray-300 rounded-md px-3 py-2 text-sm w-full " +
        "focus:outline-none focus:ring-2 focus:ring-blue-500 " +
        className
      }
      {...rest}
    />
  );
}
