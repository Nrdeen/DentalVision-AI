import { createFileRoute } from "@tanstack/react-router";
import { FindingsSummary } from "@/components/analysis/findings-summary";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { gateFindings } from "@/lib/dentaai/ensemble";
import { t } from "@/lib/dentaai/i18n";
import { panoramicCohort } from "@/lib/dentaai/panoramic-age";
import { useApp } from "@/lib/dentaai/store";
import { Input } from "@/components/ui/input";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/xray")({ component: XrayPage });

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
  const noteKey =
    cohort === "adult"
      ? "xray.adultModule"
      : cohort === "child"
        ? "xray.childHeld"
        : cohort === "adolescent"
          ? "xray.gapHeld"
          : "xray.ageHint";

  // Adult panoramic module only. A child or missing age never starts the adult model.
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
    <div className="space-y-4">
      <section className="card-surface flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <label htmlFor="patient-age" className="text-sm font-semibold">
            {t(lang, "xray.ageLabel")}
          </label>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{t(lang, noteKey)}</p>
        </div>
        <Input
          id="patient-age"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          className="w-full sm:w-28"
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
      </section>
      <FindingsSummary findings={visible} withheldCount={cohort === "adult" ? gated.withheld.length : 0} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
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
        />
        <FindingsPanel modality="xray" findings={visible} />
      </div>
    </div>
  );
}
