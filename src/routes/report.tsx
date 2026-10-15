import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  Images,
  Info,
  Lightbulb,
  Link2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { MiniFinding } from "@/components/analysis/finding-cards";
import { FindingOverlay } from "@/components/analysis/finding-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fuseFindings, getRecommendationKeys } from "@/lib/dentaai/fusion";
import { findingLabel, t } from "@/lib/dentaai/i18n";
import { downloadReportPdf } from "@/lib/dentaai/pdf";
import { useApp } from "@/lib/dentaai/store";
import type { Finding } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({ component: ReportPage });

function ReportPage() {
  const lang = useApp((s) => s.language);
  const xrayImage = useApp((s) => s.xrayImage);
  const intraoralImage = useApp((s) => s.intraoralImage);
  const xrayFindings = useApp((s) => s.xrayFindings);
  const intraoralFindings = useApp((s) => s.intraoralFindings);
  const fusion = useMemo(
    () => {
      // Only fuse findings if both images are present
      // If only one image is present, use only that modality's findings
      if (xrayImage && intraoralImage) {
        return fuseFindings(xrayFindings, intraoralFindings);
      } else if (xrayImage && !intraoralImage) {
        // X-Ray only: treat intraoral as empty
        return fuseFindings(xrayFindings, []);
      } else if (!xrayImage && intraoralImage) {
        // Intraoral only: treat xray as empty
        return fuseFindings([], intraoralFindings);
      } else {
        // No images: empty fusion
        return fuseFindings([], []);
      }
    },
    [xrayFindings, intraoralFindings, xrayImage, intraoralImage],
  );
  const [tab, setTab] = useState<"fusion" | "report">("fusion");
  const [mode, setMode] = useState<"compare" | "matched" | "all">("compare");

  const overall =
    fusion.overallKey === "moderate"
      ? t(lang, "report.moderate")
      : fusion.overallKey === "mild"
        ? t(lang, "report.mild")
        : t(lang, "report.lowRisk");
  const note =
    fusion.noteKey === "review"
      ? t(lang, "report.review")
      : fusion.noteKey === "follow"
        ? t(lang, "report.follow")
        : t(lang, "report.routine");

  const xList = mode === "matched"
      ? xrayFindings.filter((f) => ["caries", "deepCaries", "xrayKuretaj"].includes(f.key))
    : xrayFindings;
  const iList =
    mode === "matched"
      ? intraoralFindings.filter((f) => ["earlyCaries", "permanentCaries", "primaryCaries", "caries"].includes(f.key))
      : intraoralFindings;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <FileText className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(lang, "report.title")}</h1>
          <p className="text-sm text-muted-foreground">{t(lang, "report.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryStat
          icon={<Images className="size-5" />}
          label={t(lang, "report.xrayCard")}
          value={fusion.xrayCount}
          hint={t(lang, "report.issues")}
          tone="primary"
        />
        <SummaryStat
          icon={<FileText className="size-5" />}
          label={t(lang, "report.intraCard")}
          value={fusion.intraCount}
          hint={t(lang, "report.issues")}
          tone="low"
        />
        <SummaryStat
          icon={<Link2 className="size-5" />}
          label={t(lang, "report.sharedCard")}
          value={fusion.sharedCount}
          hint={t(lang, "report.sharedHint")}
          tone="finding-gingivitis"
        />
        <div className="card-surface rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">{t(lang, "report.overallCard")}</p>
          <p className="mt-2 text-xl font-semibold text-medium">{overall}</p>
          <Badge variant="medium" className="mt-2">
            {note}
          </Badge>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ModalityPane
              title={t(lang, "report.xrayTitle")}
              count={fusion.xrayCount}
              image={xrayImage}
              findings={xList}
            />
            <ModalityPane
              title={t(lang, "report.intraTitle")}
              count={fusion.intraCount}
              image={intraoralImage}
              findings={iList}
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-2xl bg-secondary p-1">
            {(
              [
                ["compare", "report.compare"],
                ["matched", "report.matched"],
                ["all", "report.all"],
              ] as const
            ).map(([id, key]) => (
              <button
                type="button"
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-sm font-medium",
                  mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t(lang, key)}
              </button>
            ))}
          </div>

          <div className="card-surface overflow-hidden rounded-2xl">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{t(lang, "report.table")}</p>
              <p className="text-xs text-muted-foreground">{t(lang, "report.tableHint")}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">{t(lang, "report.colProblem")}</th>
                    <th className="px-4 py-2 font-medium">{t(lang, "report.colXray")}</th>
                    <th className="px-4 py-2 font-medium">{t(lang, "report.colIntra")}</th>
                    <th className="px-4 py-2 font-medium">{t(lang, "report.colResult")}</th>
                  </tr>
                </thead>
                <tbody>
                  {fusion.rows.map((row) => (
                    <tr key={row.problem} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{findingLabel(lang, row.problemKey)}</td>
                      <td className="px-4 py-3">
                        <Presence on={row.xray} lang={lang} />
                      </td>
                      <td className="px-4 py-3">
                        <Presence on={row.intraoral} lang={lang} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            row.level === "shared" && "bg-high-soft text-high",
                            row.level === "xray_only" && "bg-medium-soft text-medium",
                            row.level === "intra_only" && "bg-low-soft text-low",
                          )}
                        >
                          {row.level === "shared" ? (
                            <AlertTriangle className="size-3" />
                          ) : row.level === "xray_only" ? (
                            <AlertTriangle className="size-3" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )}
                          {t(lang, `report.${row.resultKey}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="card-surface rounded-2xl p-3">
          <div className="mb-3 flex rounded-xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setTab("fusion")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold",
                tab === "fusion" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              <Brain className="size-3.5" />
              {t(lang, "report.fusion")}
            </button>
            <button
              type="button"
              onClick={() => setTab("report")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold",
                tab === "report" ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              <FileText className="size-3.5" />
              {t(lang, "common.report")}
            </button>
          </div>

          <div className="mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="size-4 text-primary" />
              {t(lang, "report.fusionLogic")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t(lang, "report.fusionLead")}</p>
          </div>

          <LogicCard tone="low-soft" title={t(lang, "report.logicShared")} hint={t(lang, "report.logicSharedHint")} ok />
          <LogicCard tone="accent" title={t(lang, "report.logicDeep")} hint={t(lang, "report.logicDeepHint")} />
          <LogicCard
            tone="secondary"
            title={t(lang, "report.logicSurface")}
            hint={t(lang, "report.logicSurfaceHint")}
            purple
          />

          <div className="mt-4 rounded-xl bg-muted p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <FileText className="size-4 text-primary" />
              {t(lang, "report.summaryTitle")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t(lang, "report.summaryBody").replace("{n}", String(fusion.rows.length))}
            </p>
          </div>
          <div className="mt-3 rounded-xl bg-accent p-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Lightbulb className="size-4 text-primary" />
              {t(lang, "common.recommendations")}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {getRecommendationKeys(fusion).map((key) => (
                <li key={key}>• {t(lang, key)}</li>
              ))}
            </ul>
          </div>
          <Button
            className="mt-3 w-full"
            onClick={() =>
              void downloadReportPdf({
                lang,
                xray: xrayFindings,
                intraoral: intraoralFindings,
                fusion,
                // Determine report type based on available images
                reportType: xrayImage && intraoralImage ? "combined" : xrayImage ? "xray" : "intraoral",
              })
            }
          >
            <Download />
            {t(lang, "common.downloadPdf")}
          </Button>
        </aside>
      </div>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
  tone: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in oklab, var(--color-${tone}) 14%, white)`,
            color: `var(--color-${tone})`,
          }}
        >
          {icon}
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function ModalityPane({
  title,
  count,
  image,
  findings,
}: {
  title: string;
  count: number;
  image: string | null;
  findings: Finding[];
}) {
  const lang = useApp((s) => s.language);
  return (
    <div className="card-surface overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
        <Badge variant="primary">
          {count} {t(lang, "report.issues")}
        </Badge>
      </div>
      <div className="relative aspect-16/10 bg-foreground">
        {image ? <img src={image} alt="" className="size-full object-cover" /> : null}
        {image ? <FindingOverlay findings={findings} lang={lang} compact /> : null}
      </div>
      <div className="space-y-2 p-3">
        {findings.slice(0, 4).map((f) => (
          <MiniFinding key={f.id} finding={f} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function Presence({ on, lang }: { on: boolean; lang: "en" | "tr" }) {
  return on ? (
    <Badge variant="low">{t(lang, "report.present")}</Badge>
  ) : (
    <Badge variant="muted">{t(lang, "report.absent")}</Badge>
  );
}

function LogicCard({
  title,
  hint,
  ok,
  purple,
  tone,
}: {
  title: string;
  hint: string;
  ok?: boolean;
  purple?: boolean;
  tone: string;
}) {
  return (
    <div className={cn("mb-2 rounded-xl p-3", tone === "low-soft" && "bg-low-soft", tone === "accent" && "bg-accent", tone === "secondary" && "bg-secondary")}>
      <p className="flex items-start gap-2 text-xs font-semibold">
        {ok ? (
          <CheckCircle2 className="mt-0.5 size-4 text-low" />
        ) : purple ? (
          <Info className="mt-0.5 size-4 text-finding-gingivitis" />
        ) : (
          <Info className="mt-0.5 size-4 text-primary" />
        )}
        {title}
      </p>
      <p className="mt-1 pl-6 text-xs text-muted-foreground">→ {hint}</p>
    </div>
  );
}
