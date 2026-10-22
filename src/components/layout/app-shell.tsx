import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, FileText, Home, Images, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/layout/logo";
import { findingLabel, t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/xray", key: "nav.xray", icon: Images },
  { to: "/intraoral", key: "nav.intraoral", icon: Camera },
  { to: "/report", key: "nav.report", icon: FileText },
  { to: "/settings", key: "nav.settings", icon: Settings },
] as const;

const WORKSPACE = new Set(["/xray", "/intraoral"]);

export function AppShell({ children }: { children: ReactNode }) {
  const lang = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const workspace = WORKSPACE.has(pathname);

  return (
    <div className="min-h-dvh bg-[#f7f8fa]">
      <header className="sticky top-0 z-40 border-b border-[#e8edf2] bg-white">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <Link to="/" className="shrink-0">
            <BrandLockup subtitle={t(lang, "brand.subtitle")} />
          </Link>

          <nav aria-label={t(lang, "nav.home")} className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium",
                    active ? "bg-[#eef4f8] text-foreground" : "text-muted-foreground hover:bg-[#f3f6f8] hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {t(lang, item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-lg bg-[#f3f6f8] p-0.5">
              {(["en", "tr"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={cn(
                    "h-7 rounded-md px-2 text-xs font-semibold",
                    lang === code ? "bg-white text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                  onClick={() => setLanguage(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main
        className={cn(
          workspace ? "h-[calc(100dvh-var(--header-h))] overflow-hidden" : "mx-auto max-w-6xl px-4 py-6 lg:px-6",
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function filterByQuery<T extends { key: string; tooth: string }>(items: T[], query: string, lang: "en" | "tr") {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (f) =>
      f.tooth.toLowerCase().includes(q) ||
      f.key.toLowerCase().includes(q) ||
      findingLabel(lang, f.key).toLowerCase().includes(q),
  );
}
