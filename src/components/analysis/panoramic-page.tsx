import { CalendarDays, Images, Search } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { gateFindings } from "@/lib/dentaai/ensemble";
import { t } from "@/lib/dentaai/i18n";
import { panoramicCohort } from "@/lib/dentaai/panoramic-age";
import { useApp } from "@/lib/dentaai/store";
import { qualityBodyKey, qualityTitleKey, shouldShowQualityBanner } from "@/lib/dentaai/xray-quality";

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
    <div className="dx-main">
      <div className="dx-left">
        {quality && shouldShowQualityBanner(quality) ? (
          <div className="dx-note">
            <b>{t(lang, qualityTitleKey(quality.level))}</b>
            <p>{t(lang, qualityBodyKey(quality.level))}</p>
          </div>
        ) : null}
        <div className="dx-case">
          <div className="dx-chip strong">
            <Images className="size-[19px]" style={{ color: "var(--acct)" }} strokeWidth={1.8} />
            {t(lang, "xray.ws.modality")}
          </div>
          <label className="dx-chip">
            {t(lang, "workspace.age")}
            <input
              id="patient-age"
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              aria-describedby="patient-age-hint"
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
          <div className="dx-chip">
            <CalendarDays className="size-[19px]" strokeWidth={1.8} />
            {examDate}
          </div>
        </div>
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
        />
        <p id="patient-age-hint" className="sr-only">
          {t(lang, noteKey)}
        </p>
      </div>
      <aside className="dx-right">
        <label className="dx-search">
          <Search className="size-5" strokeWidth={1.8} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(lang, "xray.ws.search")}
            aria-label={t(lang, "xray.ws.search")}
          />
        </label>
        <FindingsPanel
          modality="xray"
          variant="workstation"
          findings={visible}
          withheldCount={cohort === "adult" ? gated.withheld.length : 0}
        />
      </aside>
    </div>
  );
}
