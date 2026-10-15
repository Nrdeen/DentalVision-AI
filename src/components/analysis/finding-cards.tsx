import { ToothMark } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { ConfidenceRing } from "@/components/analysis/confidence-ring";
import { findingLabel, positionLabel, severityLabel, t } from "@/lib/dentaai/i18n";
import type { Finding, Lang } from "@/lib/dentaai/types";
import { useApp } from "@/lib/dentaai/store";
import { cn } from "@/lib/utils";

export function FindingCards({ findings, showTooth = true }: { findings: Finding[]; showTooth?: boolean }) {
  const lang = useApp((s) => s.language);
  const selected = useApp((s) => s.selectedFindingId);
  const setSelected = useApp((s) => s.setSelectedFindingId);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {findings.map((f) => (
        <button
          type="button"
          key={f.id}
          onClick={() => setSelected(selected === f.id ? null : f.id)}
          className={cn(
            "card-surface rounded-2xl p-4 text-left transition-shadow",
            selected === f.id && "ring-2 ring-primary/30",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-full"
                style={{ background: `color-mix(in oklab, var(${f.colorVar}) 14%, white)` }}
              >
                <ToothMark className="size-5" style={{ color: `var(${f.colorVar})` }} />
              </span>
              <div>
                {showTooth && f.tooth !== "-" ? (
                  <>
                    <p className="text-xs text-muted-foreground">{t(lang, "common.toothNo")}</p>
                    <p className="text-lg font-semibold leading-tight">{f.tooth}</p>
                    <p className="text-xs text-muted-foreground">{positionLabel(lang, f.positionKey)}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold leading-tight">{findingLabel(lang, f.key)}</p>
                    <p className="text-xs text-muted-foreground">{positionLabel(lang, f.positionKey)}</p>
                  </>
                )}
              </div>
            </div>
            <ConfidenceRing value={f.confidence} colorVar={f.colorVar} />
          </div>
          {showTooth && f.tooth !== "-" ? (
            <p className="mt-3 text-sm font-semibold" style={{ color: `var(${f.colorVar})` }}>
              {findingLabel(lang, f.key)}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {t(lang, "common.confidence")}: {Math.round(f.confidence * 100)}%
          </p>
          <div className="mt-3">
            <Badge variant={f.severity}>{severityLabel(lang, f.severity)}</Badge>
          </div>
        </button>
      ))}
    </div>
  );
}

export function MiniFinding({ finding, lang }: { finding: Finding; lang: Lang }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="flex size-8 items-center justify-center rounded-full"
          style={{ background: `color-mix(in oklab, var(${finding.colorVar}) 14%, white)` }}
        >
          <ToothMark className="size-3.5" style={{ color: `var(${finding.colorVar})` }} />
        </span>
        <div>
          <p className="text-sm font-medium">
            {findingLabel(lang, finding.key)} {finding.tooth !== "-" ? `(${finding.tooth})` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{positionLabel(lang, finding.positionKey)}</p>
        </div>
      </div>
      <Badge variant={finding.severity}>{lang === "tr" ? "Var" : "Yes"}</Badge>
    </div>
  );
}
