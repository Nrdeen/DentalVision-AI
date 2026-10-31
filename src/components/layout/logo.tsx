import { Link } from "@tanstack/react-router";
import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function ToothMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-[18px]", className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M7 3c-3 0-4 3-3 6 .6 2 1 3 1.2 6 .2 3 1.3 6 3 6 2 0 1.5-5 4.8-5s2.8 5 4.8 5c1.7 0 2.8-3 3-6 .2-3 .6-4 1.2-6 1-3 0-6-3-6-2 0-3 1-5 1S9 3 7 3Z" />
    </svg>
  );
}

export function BrandLockup({ compact = false, subtitle }: { compact?: boolean; subtitle?: string }) {
  return (
    <Link to="/" className="dx-brand">
      <span className="dx-logo" aria-hidden="true">
        <ToothMark className="size-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="dx-wm">DentalVision AI</span>
        {!compact && subtitle ? <span className="dx-sub">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
