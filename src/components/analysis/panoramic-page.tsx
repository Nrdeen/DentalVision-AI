import { CalendarDays, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DentalChart } from "@/components/analysis/dental-chart";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { FindingsSummary } from "@/components/analysis/findings-summary";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { gateFindings } from "@/lib/dentaai/ensemble";
import { t } from "@/lib/dentaai/i18n";
import { panoramicCohort } from "@/lib/dentaai/panoramic-age";
import { useApp } from "@/lib/dentaai/store";
import { flagKey, qualityBodyKey, qualityTitleKey, shouldShowQualityBanner } from "@/lib/dentaai/xray-quality";

export function PanoramicPage() {
  const lang = useApp((s) => s.language);
  const query = useApp((s) => s.query);
  const setQuery = useApp((s) => s.setQuery);
  const image = useApp((s) => s.xrayImage);
  const findings = useApp((s) => s.xrayFindings);
  const quality = useApp((s) => s.xrayQuality);
  const adjust = useApp((s) => s.xrayAdjust);
  const analyzing = useApp((s) => s.analyzing) === "xray";
  const setXrayAdjust = useApp((s) => s.setXrayAdjust);
  const resetXrayAdjust = useApp((s) => s.resetXrayAdjust);
  const runXray = useApp((s) => s.runXray);
  const threshold = useApp((s) => s.threshold);
  const patientAge = useApp((s) => s.patientAge);
  const setPatientAge = useApp((s) => s.setPatientAge);
  const cohort = panoramicCohort(patientAge);
  const gated = gateFindings(filterByQuery(findings, query, lang), threshold);
  const visible = cohort === "adult" ? gated.visible : [];
  const analyzedImageRef = useRef<string | null>(null);
  const selectedFindingId = useApp((s) => s.selectedFindingId);
  const [pane, setPane] = useState<"film" | "findings" | "report">("film");
  const examDate = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    [lang],
  );
  const noteKey =
    cohort === "adult"
      ? "xray.adultModule"
      : cohort === "child"
        ? "xray.childHeld"
        : cohort === "adolescent"
          ? "xray.gapHeld"
          : "xray.ageHint";

  useEffect(() => {
    if (selectedFindingId) setPane("findings");
  }, [selectedFindingId]);

  useEffect(() => {
    if (cohort !== "adult") {
      analyzedImageRef.current = null;
      return;
    }
    if (image && image !== analyzedImageRef.current && !analyzing && findings.length === 0) {
      analyzedImageRef.current = image;
      void runXray(image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, cohort]);

  return (
    <div className="ws-page flex h-full min-h-0 flex-col gap-2.5 p-2.5 lg:p-3">
      {quality && shouldShowQualityBanner(quality) ? (
        <div
          className="shrink-0 rounded-xl px-4 py-2.5"
          style={{
            background: quality.level === "poor" ? "var(--color-medium-soft)" : "var(--color-accent)",
          }}
        >
          <p className="text-sm font-semibold text-foreground">{t(lang, qualityTitleKey(quality.level))}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t(lang, qualityBodyKey(quality.level))}</p>
          {quality.flags.length > 0 ? (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {quality.flags.map((flag) => {
                const key = flagKey(flag);
                return key ? (
                  <li key={flag} className="rounded-md bg-card px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {t(lang, key)}
                  </li>
                ) : null;
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      <header className="ws-casebar flex flex-wrap items-center gap-3 px-3 py-2.5">
        <span className="text-sm font-semibold">{t(lang, "xray.ws.modality")}</span>
        <span className="hidden h-8 w-px bg-[#e8edf2] sm:block" />
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {t(lang, "workspace.age")}
          <Input
            id="patient-age"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            aria-describedby="patient-age-hint"
            className="h-8 w-16 px-2"
            placeholder="16"
            value={patientAge ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                setPatientAge(null);
                return;
              }
              const years = Number(raw);
              if (Number.isFinite(years) && years >= 0 && years <= 120) setPatientAge(Math.floor(years));
            }}
          />
        </label>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {examDate}
        </span>
        {quality ? (
          <span className="rounded-full bg-[#eef5fb] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d4f63]">
            {t(lang, qualityTitleKey(quality.level))}
          </span>
        ) : null}

        <label className="relative ml-auto min-w-[11rem] max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(lang, "xray.ws.search")}
            className="h-8 pl-8"
          />
        </label>

        <div className="xl:hidden">
          <div className="tab-track">
            {(
              [
                ["film", "workspace.film"],
                ["findings", "workspace.findings"],
                ["report", "workspace.report"],
              ] as const
            ).map(([id, key]) => (
              <button
                key={id}
                type="button"
                data-active={pane === id}
                className="tab-btn"
                onClick={() => setPane(id)}
              >
                {t(lang, key)}
                {id === "findings" && visible.length > 0 ? (
                  <span className="tabular-nums">{visible.length}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-2.5 xl:grid-cols-[minmax(0,1fr)_20.5rem]">
        <ImageWorkspace
          modality="xray"
          variant="workstation"
          image={image}
          findings={visible}
          adjust={adjust}
          onAdjust={setXrayAdjust}
          onReset={resetXrayAdjust}
          onUpload={(url) => {
            analyzedImageRef.current = null;
            void runXray(url);
          }}
          analyzing={analyzing}
          dropLabel={t(lang, "common.drop")}
          qualityBadge={
            quality ? (
              <div className="absolute bottom-12 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-film-foreground">
                {t(lang, "xray.ws.quality")} · {t(lang, qualityTitleKey(quality.level))}
              </div>
            ) : null
          }
          overlay={
            pane === "film" ? null : (
              <aside className="absolute inset-y-0 right-0 z-20 flex h-full w-[min(100%,22rem)] min-w-64 flex-col overflow-hidden border-l border-border bg-card xl:hidden">
                <FindingsPanel
                  modality="xray"
                  variant="workstation"
                  findings={visible}
                  forcedTab={pane === "report" ? "report" : "ai"}
                  withheldCount={cohort === "adult" ? gated.withheld.length : 0}
                />
              </aside>
            )
          }
        />

        <aside className="ws-panel hidden min-h-0 flex-1 overflow-hidden xl:flex">
          <FindingsPanel
            modality="xray"
            variant="workstation"
            findings={visible}
            withheldCount={cohort === "adult" ? gated.withheld.length : 0}
          />
        </aside>
      </div>

      <p id="patient-age-hint" className="sr-only">
        {t(lang, noteKey)}
      </p>
    </div>
  );
}
