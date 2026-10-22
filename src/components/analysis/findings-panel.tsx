import { Brain, ChevronRight, Download, Eye, EyeOff, FileText } from "lucide-react";
import { ToothMark } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findingDesc, findingLabel, t } from "@/lib/dentaai/i18n";
import { downloadReportPdf } from "@/lib/dentaai/pdf";
import { fuseFindings } from "@/lib/dentaai/fusion";
import type { Finding, Modality } from "@/lib/dentaai/types";
import { useApp } from "@/lib/dentaai/store";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { FindingDetails } from "@/components/analysis/finding-details";
import { DentalChart } from "@/components/analysis/dental-chart";
import { ReportTab } from "@/components/analysis/report-tab";
import { toothDisplay } from "@/lib/dentaai/tooth-numbering";
import { findingsInGroup, groupConfidence, XRAY_FINDING_GROUPS } from "@/lib/dentaai/xray-groups";

export function FindingsPanel({
  modality,
  findings,
  forcedTab,
  withheldCount = 0,
  variant = "default",
}: {
  modality: Modality;
  findings: Finding[];
  forcedTab?: "ai" | "report";
  withheldCount?: number;
  variant?: "default" | "workstation";
}) {
  const lang = useApp((s) => s.language);
  const selected = useApp((s) => s.selectedFindingId);
  const setSelected = useApp((s) => s.setSelectedFindingId);
  const hidden = useApp((s) => s.hiddenFindingIds);
  const toggleHidden = useApp((s) => s.toggleFindingHidden);
  const setHidden = useApp((s) => s.setHiddenFindingIds);
  const allShown = findings.every((f) => !hidden.includes(f.id));
  const [tab, setTab] = useState<"ai" | "chart" | "report">("ai");
  const activeTab = forcedTab ?? tab;
  const workstation = variant === "workstation";
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Selecting a detection on the image jumps to its card here.
  useEffect(() => {
    if (!selected) return;
    setTab("ai");
    const id = requestAnimationFrame(() =>
      itemRefs.current[selected]?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
    return () => cancelAnimationFrame(id);
  }, [selected]);

  return (
    <aside className={cn("flex h-full min-h-0 flex-col overflow-hidden", workstation ? "p-4" : "p-3")}>
      {workstation ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t(lang, "xray.ws.findings")}</h2>
          </div>
          {findings.length > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">{findings.length}</span>
          ) : null}
        </div>
      ) : null}

      {forcedTab ? null : (
        <div className="tab-track mb-3">
          <button
            type="button"
            data-active={activeTab === "ai"}
            onClick={() => setTab("ai")}
            className="tab-btn flex-1"
          >
            <Brain className="size-3.5" />
            {workstation ? t(lang, "workspace.findings") : t(lang, "common.aiAnalysis")}
          </button>
          {workstation ? (
            <button
              type="button"
              data-active={activeTab === "chart"}
              onClick={() => setTab("chart")}
              className="tab-btn flex-1"
            >
              {t(lang, "xray.ws.chart")}
            </button>
          ) : null}
          <button
            type="button"
            data-active={activeTab === "report"}
            onClick={() => setTab("report")}
            className="tab-btn flex-1"
          >
            <FileText className="size-3.5" />
            {t(lang, "common.report")}
          </button>
        </div>
      )}

      {activeTab === "chart" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DentalChart findings={findings} tr={lang === "tr"} />
        </div>
      ) : null}

      {activeTab === "ai" ? (
        <>
          {workstation ? <FindingGroupMeters findings={findings} /> : null}
          {!workstation && findings.length > 0 ? <DentalChart findings={findings} tr={lang === "tr"} /> : null}
          {workstation && forcedTab && findings.length > 0 ? (
            <DentalChart findings={findings} tr={lang === "tr"} compact />
          ) : null}

          <div className="mb-2 flex items-center justify-between gap-2">
            <div className={cn("flex items-center gap-2", workstation && "sr-only")}>
              <Brain className="size-4 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">{t(lang, "common.detected")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t(lang, modality === "xray" ? "common.detectedHintXray" : "common.detectedHintIntra")}
                </p>
              </div>
            </div>
            {findings.length > 1 ? (
              <button
                type="button"
                onClick={() => setHidden(allShown ? findings.map((f) => f.id) : [])}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {allShown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {allShown ? (lang === "tr" ? "Hepsini gizle" : "Hide all") : lang === "tr" ? "Hepsini göster" : "Show all"}
              </button>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {findings.length === 0 ? (
              <p className="rounded-md bg-muted px-3 py-4 text-xs leading-relaxed text-muted-foreground">
                {t(lang, "common.noFindings")}
                {withheldCount > 0 ? ` ${t(lang, "ensemble.withheld", { n: withheldCount })}` : ""}
              </p>
            ) : null}
            {findings.map((f, index) => {
              const isSelected = selected === f.id;
              const isHidden = hidden.includes(f.id);
              const pct = Math.round(f.confidence * 100);
              return (
                <div
                  key={f.id}
                  ref={(el) => {
                    itemRefs.current[f.id] = el;
                  }}
                  className={cn(
                    "overflow-hidden rounded-xl border border-border bg-card transition-colors",
                    isSelected && "border-primary/40 bg-accent/50",
                  )}
                >
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      aria-expanded={isSelected}
                      onClick={() => setSelected(isSelected ? null : f.id)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-1 text-left transition-opacity",
                        isHidden && "opacity-50",
                      )}
                    >
                      <span
                        className="relative flex size-10 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `color-mix(in oklab, var(${f.colorVar}) 14%, white)` }}
                      >
                        <ToothMark className="size-4" style={{ color: `var(${f.colorVar})` }} />
                        <span
                          className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full text-[9px] font-bold leading-none text-white ring-1 ring-white"
                          style={{ background: `var(${f.colorVar})` }}
                        >
                          {index + 1}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="min-w-0 text-sm font-semibold leading-tight">
                            {toothDisplay(f) ? `${lang === "tr" ? "Diş" : "Tooth"} ${toothDisplay(f)} – ` : ""}
                            {findingLabel(lang, f.key)}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <Badge variant={f.severity}>{t(lang, `common.${f.severity}`)}</Badge>
                            <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                          </span>
                        </span>
                        <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${pct}%`, background: `var(${f.colorVar})` }}
                          />
                        </span>
                        <span className="mt-1.5 block text-xs leading-snug text-muted-foreground">
                          {findingDesc(lang, f.descriptionKey)}
                        </span>
                      </span>
                    </button>
                    <div className="flex flex-col items-center justify-between border-l border-border/60 px-1.5 py-2">
                      <button
                        type="button"
                        aria-pressed={!isHidden}
                        aria-label={lang === "tr" ? "Görüntüde göster/gizle" : "Show/hide on image"}
                        title={lang === "tr" ? "Görüntüde göster/gizle" : "Show/hide on image"}
                        onClick={() => toggleHidden(f.id)}
                        className={cn(
                          "grid size-7 place-items-center rounded-full transition-colors hover:bg-muted",
                          isHidden ? "text-muted-foreground" : "text-primary",
                        )}
                      >
                        {isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                      <ChevronRight
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isSelected && "rotate-90",
                        )}
                      />
                    </div>
                  </div>
                  {isSelected ? <FindingDetails finding={f} lang={lang} modality={modality} /> : null}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {activeTab === "report" ? <ReportTab modality={modality} findings={findings} /> : null}

      <Button
        className="mt-3 w-full"
        onClick={() =>
          void downloadReportPdf({
            lang,
            xray: modality === "xray" ? findings : [],
            intraoral: modality === "intraoral" ? findings : [],
            fusion: fuseFindings(modality === "xray" ? findings : [], modality === "intraoral" ? findings : []),
            reportType: modality,
          })
        }
      >
        <Download />
        {t(lang, "common.downloadPdf")}
      </Button>
    </aside>
  );
}

function FindingGroupMeters({ findings }: { findings: Finding[] }) {
  const lang = useApp((s) => s.language);
  const selected = useApp((s) => s.selectedFindingId);
  const setSelected = useApp((s) => s.setSelectedFindingId);

  return (
    <div className="mb-3 space-y-2.5">
      {XRAY_FINDING_GROUPS.map((group) => {
        const items = findingsInGroup(findings, group.keys);
        const pct = Math.round(groupConfidence(items) * 100);
        const active = items.some((f) => f.id === selected);
        return (
          <button
            key={group.id}
            type="button"
            disabled={items.length === 0}
            onClick={() => {
              const i = items.findIndex((f) => f.id === selected);
              setSelected(items[(i + 1) % items.length].id);
            }}
            className={cn(
              "w-full rounded-xl px-1 py-1 text-left disabled:opacity-55",
              active && "bg-accent/70",
            )}
          >
            <span className="flex items-start gap-2.5">
              <span
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full"
                style={{ background: `color-mix(in oklab, var(${group.colorVar}) 16%, white)` }}
              >
                <ToothMark className="size-3.5" style={{ color: `var(${group.colorVar})` }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold">{t(lang, group.labelKey)}</span>
                  <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {items.length === 0
                    ? t(lang, "xray.ws.noneDetected")
                    : t(lang, "xray.ws.detectedCount", { n: items.length })}
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#eef2f4]">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, background: `var(${group.colorVar})` }}
                  />
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}