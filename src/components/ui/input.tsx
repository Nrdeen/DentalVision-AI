import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-full border border-border bg-muted px-4 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/30",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
