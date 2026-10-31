import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-[34px] w-full rounded-[10px] border border-border bg-secondary px-3 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
