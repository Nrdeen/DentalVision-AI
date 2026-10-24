import { Link } from "@tanstack/react-router";
import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function ToothMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-5", className)} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M16 4.2c3.2 0 5.6 1.7 7.2 3.6 1.5 1.8 2.4 4 2.6 6.2.2 2.4-.4 4.5-1.6 6.6-1.1 1.9-2.2 3.6-2.6 5.8-.3 1.6-1.6 2.8-3.2 2.8-1.2 0-2-.7-2.4-1.8L16 25l-.1 2.4c-.4 1.1-1.2 1.8-2.4 1.8-1.6 0-2.9-1.2-3.2-2.8-.4-2.2-1.5-3.9-2.6-5.8-1.2-2.1-1.8-4.2-1.6-6.6.2-2.2 1.1-4.4 2.6-6.2C10.4 5.9 12.8 4.2 16 4.2Z"
      />
    </svg>
  );
}

export function BrandLockup({ compact = false, subtitle }: { compact?: boolean; subtitle?: string }) {
  return (
    <Link to="/" className="dx-brand">
      <span className="dx-logo" aria-hidden="true">
        <ToothMark className="size-7" />
      </span>
      <span className="min-w-0">
        <span className="dx-wm">
          Denta<span>AI</span>
        </span>
        {!compact ? <span className="dx-sub">{subtitle ?? "Clinical imaging"}</span> : null}
      </span>
    </Link>
  );
}
