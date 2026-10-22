import { findingLabel, t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";
import type { Finding, Severity } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

const SEVERITIES: Severity[] = ["high", "medium", "low"];

const SEVERITY_TEXT: Record<Severity, { tr: string; en: string }> = {
  high: { tr: "Yüksek", en: "High" },
  medium: { tr: "Orta", en: "Medium" },
  low: { tr: "Düşük", en: "Low" },
};

const SEVERITY_BG: Record<Severity, string> = {
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export function FindingsSummary({
  findings,
  withheldCount = 0,
  compact = false,
}: {
  findings: Finding[];
  withheldCount?: number;
  compact?: boolean;
}) {
  const lang = useApp((s) => s.language);
  const selectedId = useApp((s) => s.selectedFindingId);
  const select = useApp((s) => s.setSelectedFindingId);
  const tr = lang === "tr";

  if (findings.length === 0) {
    if (withheldCount <= 0) return null;
    return (
      <section className="card-surface rounded-2xl p-4 text-sm text-muted-foreground">
        {t(lang, "ensemble.withheld", { n: withheldCount })}
      </section>
    );
  }

  const bySeverity = SEVERITIES.map((s) => ({
    severity: s,
    items: findings.filter((f) => f.severity === s),
  }));
  const avg = findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length;
  const urgent = bySeverity[0].items.length;
  const selectedKey = findings.find((f) => f.id === selectedId)?.key;

  const groups = Array.from(
    findings.reduce((map, f) => {
      const g = map.get(f.key) ?? [];
      g.push(f);
      return map.set(f.key, g);
    }, new Map<string, Finding[]>()),
  ).sort((a, b) => b[1].length - a[1].length);

  // Repeated clicks on a chip walk through that group's detections.
  const jumpTo = (items: Finding[]) => {
    const i = items.findIndex((f) => f.id === selectedId);
    select(items[(i + 1) % items.length].id);
  };

  return (
    <section
      aria-label={tr ? "Bulgu özeti" : "Findings summary"}
      className={cn(
        "card-surface flex flex-col gap-4 rounded-2xl p-4",
        compact ? "h-full min-h-0 overflow-auto" : "lg:flex-row lg:items-center lg:gap-6",
      )}
    >
      <div className="flex items-center gap-4 lg:w-52 lg:shrink-0">
        <p className="text-4xl font-bold leading-none tabular-nums">{findings.length}</p>
        <div className="text-xs leading-snug text-muted-foreground">
          <p className="text-sm font-semibold text-foreground">{tr ? "Tespit edilen bulgu" : "Findings detected"}</p>
          <p>
            {tr ? "Ort. güven" : "Avg. confidence"} {Math.round(avg * 100)}%
          </p>
          {withheldCount > 0 ? <p>{t(lang, "ensemble.withheld", { n: withheldCount })}</p> : null}
        </div>
      </div>

      <div className="min-w-0 lg:w-72 lg:shrink-0 lg:border-l lg:border-border/70 lg:pl-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold">{tr ? "Öncelik dağılımı" : "Priority"}</span>
          {urgent > 0 ? (
            <span className="font-semibold text-high">
              {urgent} {tr ? "acil inceleme" : "need review"}
            </span>
          ) : null}
        </div>
        <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
          {bySeverity.map(({ severity, items }) =>
            items.length ? (
              <span
                key={severity}
                className={SEVERITY_BG[severity]}
                style={{ flexGrow: items.length }}
                title={`${SEVERITY_TEXT[severity][lang]}: ${items.length}`}
              />
            ) : null,
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {bySeverity.map(({ severity, items }) => (
            <button
              key={severity}
              type="button"
              disabled={items.length === 0}
              onClick={() => jumpTo(items)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors enabled:hover:text-foreground disabled:opacity-40"
            >
              <span className={cn("size-2 rounded-full", SEVERITY_BG[severity])} />
              {SEVERITY_TEXT[severity][lang]}
              <span className="font-semibold tabular-nums text-foreground">{items.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 lg:border-l lg:border-border/70 lg:pl-6">
        <p className="mb-2 text-xs font-semibold">{tr ? "Bulgu türleri" : "Finding types"}</p>
        <div className="flex flex-wrap gap-1.5">
          {groups.map(([key, items]) => {
            const active = selectedKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => jumpTo(items)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-accent text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <span className="size-2 rounded-full" style={{ background: `var(${items[0].colorVar})` }} />
                {findingLabel(lang, key)}
                {items.length > 1 ? (
                  <span className="font-semibold tabular-nums text-foreground">×{items.length}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
