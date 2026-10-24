import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, FileText, Home, Images, Moon, Settings, Sun } from "lucide-react";
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

export function AppShell({ children }: { children: ReactNode }) {
  const lang = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const workspace = pathname === "/xray" || pathname === "/intraoral";

  return (
    <div className={cn("dx-app", theme)}>
      <header className="dx-hdr">
        <BrandLockup subtitle={t(lang, "brand.subtitle")} />
        <nav className="dx-nav" aria-label={t(lang, "nav.home")}>
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={cn("dx-nv", active && "on")} aria-current={active ? "page" : undefined}>
                <Icon className="size-[19px]" strokeWidth={1.8} />
                {t(lang, item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="dx-grp">
          <div className="dx-seg" role="group" aria-label={lang === "tr" ? "Tema" : "Theme"}>
            <button type="button" className={theme === "light" ? "on" : undefined} aria-pressed={theme === "light"} aria-label={lang === "tr" ? "Açık tema" : "Light theme"} onClick={() => setTheme("light")}>
              <Sun className="size-5" strokeWidth={1.8} />
            </button>
            <button type="button" className={theme === "dark" ? "on" : undefined} aria-pressed={theme === "dark"} aria-label={lang === "tr" ? "Koyu tema" : "Dark theme"} onClick={() => setTheme("dark")}>
              <Moon className="size-5" strokeWidth={1.8} />
            </button>
          </div>
          <div className="dx-seg" role="group" aria-label={lang === "tr" ? "Dil" : "Language"}>
            {(["en", "tr"] as const).map((code) => (
              <button key={code} type="button" className={lang === code ? "on" : undefined} aria-pressed={lang === code} onClick={() => setLanguage(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className={workspace ? "min-w-0" : "dx-page"}>{children}</main>
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
