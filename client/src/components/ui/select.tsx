import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value || "");

  const handleValueChange = (newValue: string) => {
    if (disabled) return;
    setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  return (
    <SelectContext.Provider value={{ value: internalValue, onValueChange: handleValueChange, open, setOpen, disabled }}>
      <div className={cn("relative w-full", disabled && "opacity-50 cursor-not-allowed")}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        context.disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => !context.disabled && context.setOpen(!context.open)}
      {...props}
    >
      {children}
    </div>
  );
};

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

export const SelectItem: React.FC<React.HTMLAttributes<HTMLDivElement> & { value: string }> = ({ className, children, value, ...props }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground cursor-pointer",
        context.value === value && "bg-accent",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {context.value === value && (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  return (
    <span className="block truncate">
      {context.value || placeholder}
    </span>
  );
};
