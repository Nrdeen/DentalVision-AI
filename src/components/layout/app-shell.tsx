import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Brain,
  Camera,
  FileText,
  Home,
  Images,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BrandLockup, ToothMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const lang = useApp((s) => s.language);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-primary"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {t(lang, item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

function PoweredCard() {
  const lang = useApp((s) => s.language);
  return (
    <div className="rounded-2xl bg-accent p-4">
      <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Brain className="size-4" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t(lang, "brand.powered")}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(lang, "brand.tagline")}</p>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <NavList onNavigate={onNavigate} />
      <PoweredCard />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const lang = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const query = useApp((s) => s.query);
  const setQuery = useApp((s) => s.setQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const subtitle = t(lang, "brand.subtitle");

  const notes = useMemo(
    () => [t(lang, "notify.1"), t(lang, "notify.2"), t(lang, "notify.3")],
    [lang],
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="flex items-center gap-3 px-3 py-3 lg:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu />
          </Button>
          <Link to="/" className="shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ToothMark />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block text-base font-semibold tracking-tight">{t(lang, "brand.name")}</span>
                <span className="block max-w-56 truncate text-xs text-muted-foreground xl:max-w-none">
                  {subtitle}
                </span>
              </span>
            </div>
          </Link>
          <div className="relative mx-auto hidden min-w-0 flex-1 md:block md:max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(lang, "search.placeholder")}
              className="pl-11"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  lang === "en" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("tr")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  lang === "tr" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                TR
              </button>
            </div>
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setNotesOpen((v) => !v)}>
                <Bell />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
              </Button>
              {notesOpen ? (
                <div className="absolute top-12 right-0 z-50 w-72 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
                  <p className="mb-2 px-1 text-sm font-semibold">{t(lang, "notify.title")}</p>
                  <ul className="space-y-1">
                    {notes.map((n) => (
                      <li key={n} className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-0">
        <aside className="sticky top-[73px] hidden h-[calc(100dvh-73px)] w-56 shrink-0 flex-col justify-between gap-6 bg-sidebar px-3 py-4 lg:flex">
          <NavList />
          <PoweredCard />
        </aside>
        <main className="min-w-0 flex-1 px-3 py-4 lg:px-5 lg:py-5">{children}</main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent>
          <BrandLockup />
          <div className="mt-6 h-full">
            <SidebarBody onNavigate={() => setMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
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
