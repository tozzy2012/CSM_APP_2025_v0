import * as React from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  readOnly,
  className,
}) => {
  if (readOnly) {
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none rounded-md border bg-muted/40 p-4",
          className
        )}
      >
        {value || "Nenhum conteúdo definido."}
      </div>
    );
  }

  return (
    <textarea
      className={cn(
        "min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
};

export default RichTextEditor;
