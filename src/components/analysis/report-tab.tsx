import { CalendarDays, ClipboardList, Lightbulb, Stethoscope } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "@/lib/dentaai/store";
import { buildReport } from "@/lib/dentaai/report-model";
import type { Finding, Modality, Severity } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

const SEV: Record<Severity, { bg: string; text: { tr: string; en: string } }> = {
  high: { bg: "bg-high", text: { tr: "Yüksek", en: "High" } },
  medium: { bg: "bg-medium", text: { tr: "Orta", en: "Medium" } },
  low: { bg: "bg-low", text: { tr: "Düşük", en: "Low" } },
};

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ReportTab({ modality, findings }: { modality: Modality; findings: Finding[] }) {
  const lang = useApp((s) => s.language);
  const mio = useApp((s) => s.mioClassification);
  const setSelected = useApp((s) => s.setSelectedFindingId);
  const tr = lang === "tr";

  const report = useMemo(
    () => buildReport({ lang, modality, findings, mio: modality === "intraoral" ? mio : null }),
    [lang, modality, findings, mio],
  );

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-1 bg-primary" />
        <div className="p-3">
          <p className="text-sm font-semibold leading-tight">{report.title}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="size-3" />
              <span className="font-mono">{report.reportId}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {report.generatedAt.toLocaleDateString(tr ? "tr-TR" : "en-GB")}
            </span>
            <span className="col-span-2 inline-flex items-center gap-1">
              <Stethoscope className="size-3" />
              {report.studyType}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: tr ? "Bulgu" : "Findings", value: String(report.total) },
          { label: tr ? "Yüksek öncelik" : "High priority", value: String(report.counts.high), accent: report.counts.high > 0 },
          { label: tr ? "Ort. güven" : "Avg. conf.", value: `${Math.round(report.avgConfidence * 100)}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card px-2 py-2.5 text-center">
            <p className={cn("text-xl font-bold leading-none tabular-nums", m.accent && "text-high")}>{m.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-accent/70 p-3">
        <p className="mb-1 text-xs font-semibold text-primary">{tr ? "Klinik izlenim" : "Clinical impression"}</p>
        <p className="text-xs leading-relaxed text-foreground/85">{report.impression}</p>
      </div>

      {report.total > 0 ? (
        <Section title={tr ? "Öncelik dağılımı" : "Priority distribution"}>
          <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-secondary">
            {(["high", "medium", "low"] as Severity[]).map((s) =>
              report.counts[s] ? (
                <span key={s} className={SEV[s].bg} style={{ flexGrow: report.counts[s] }} />
              ) : null,
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {(["high", "medium", "low"] as Severity[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", SEV[s].bg)} />
                {SEV[s].text[lang]}
                <b className="tabular-nums text-foreground">{report.counts[s]}</b>
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {report.total > 0 ? (
        <Section title={tr ? "Öncelik sırasına göre bulgular" : "Findings by priority"}>
          <ul className="divide-y divide-border/60">
            {report.priority.map((r) => (
              <li key={r.finding.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r.finding.id)}
                  className="flex w-full items-center gap-2 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: `var(${r.finding.colorVar})` }}
                  >
                    {r.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      {r.tooth ? `${r.tooth} · ` : ""}
                      {r.label}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">{r.region}</span>
                  </span>
                  <span className="text-xs font-semibold tabular-nums">{Math.round(r.confidence * 100)}%</span>
                  <span className={cn("size-2 shrink-0 rounded-full", SEV[r.severity].bg)} title={r.severityText} />
                </button>
              </li>
            ))}
          </ul>
          {report.hasEstimatedTeeth ? (
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              {tr
                ? "≈ Diş numaraları kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)."
                : "≈ Tooth numbers are estimated from arch geometry (not model output)."}
            </p>
          ) : null}
        </Section>
      ) : null}

      {modality === "xray" && report.total > 0 ? (
        <Section title={tr ? "Kadran dağılımı (FDI)" : "Quadrant distribution (FDI)"}>
          <div className="grid grid-cols-2 gap-1.5">
            {[report.quadrants[0], report.quadrants[1], report.quadrants[3], report.quadrants[2]].map((q) => (
              <div
                key={q.q}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px]",
                  q.count ? "border-border bg-card" : "border-dashed border-border/70 text-muted-foreground",
                )}
              >
                <span>{q.label}</span>
                <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                  {q.severity ? <span className={cn("size-2 rounded-full", SEV[q.severity].bg)} /> : null}
                  {q.count}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {report.total > 0 ? (
        <Section title={tr ? "Bulgu türleri" : "Finding types"}>
          <div className="flex flex-wrap gap-1.5">
            {report.types.map((tp) => (
              <span
                key={tp.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium"
              >
                <span className="size-2 rounded-full" style={{ background: `var(${tp.colorVar})` }} />
                {tp.label}
                {tp.count > 1 ? <b className="tabular-nums">×{tp.count}</b> : null}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {report.mio ? (
        <Section title={tr ? "MIO — Diş eti / periodontal sınıflama" : "MIO — gingival / periodontal classification"}>
          <p className="text-xs">
            <b>{report.mio.label}</b>{" "}
            <span className="text-muted-foreground">({(report.mio.confidence * 100).toFixed(1)}%)</span>
          </p>
          <div className="mt-2 space-y-1.5">
            {report.mio.probabilities.map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-[11px]">
                <span className="w-24 shrink-0 text-muted-foreground">{p.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${p.value * 100}%` }} />
                </span>
                <span className="w-9 text-right tabular-nums">{Math.round(p.value * 100)}%</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section icon={<Lightbulb className="size-3.5 text-primary" />} title={tr ? "Öneriler" : "Recommendations"}>
        <ul className="space-y-2">
          {report.recommendations.map((r) => (
            <li key={`${r.title}-${r.text}`} className="text-xs leading-relaxed">
              <span className="font-semibold">{r.title}: </span>
              <span className="text-muted-foreground">{r.text}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
