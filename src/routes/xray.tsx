import { createFileRoute } from "@tanstack/react-router";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { gateFindings } from "@/lib/dentaai/ensemble";
import { t } from "@/lib/dentaai/i18n";
import { panoramicCohort } from "@/lib/dentaai/panoramic-age";
import { useApp } from "@/lib/dentaai/store";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/xray")({
  ssr: false,
  component: XrayPage,
});

function XrayPage() {
  const lang = useApp((s) => s.language);
  const query = useApp((s) => s.query);
  const image = useApp((s) => s.xrayImage);
  const findings = useApp((s) => s.xrayFindings);
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
    <div className="relative flex h-full min-h-0 flex-col">
      <ImageWorkspace
        modality="xray"
        image={image}
        findings={visible}
        adjust={adjust}
        onAdjust={setXrayAdjust}
        onReset={resetXrayAdjust}
        onUpload={(url) => void runXray(url)}
        analyzing={analyzing}
        dropLabel={t(lang, "common.drop")}
        leading={
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            {t(lang, "workspace.age")}
            <Input
              id="patient-age"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              aria-describedby="patient-age-hint"
              className="h-9 w-16 px-2"
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
        }
        trailing={
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
        }
        overlay={
          pane === "film" ? null : (
            <aside className="absolute inset-y-0 right-0 z-20 flex h-full w-[min(100%,22rem)] min-w-64 flex-col overflow-hidden border-l border-border bg-card">
              <FindingsPanel
                modality="xray"
                findings={visible}
                forcedTab={pane === "report" ? "report" : "ai"}
                withheldCount={cohort === "adult" ? gated.withheld.length : 0}
              />
            </aside>
          )
        }
      />
      <p id="patient-age-hint" className="sr-only">
        {t(lang, noteKey)}
      </p>
    </div>
  );
}
