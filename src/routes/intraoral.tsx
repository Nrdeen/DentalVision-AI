import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Heart, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { gateFindings } from "@/lib/dentaai/ensemble";
import { t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";

export const Route = createFileRoute("/intraoral")({
  ssr: false,
  component: IntraoralPage,
});

function IntraoralPage() {
  const lang = useApp((s) => s.language);
  const query = useApp((s) => s.query);
  const setQuery = useApp((s) => s.setQuery);
  const image = useApp((s) => s.intraoralImage);
  const stateFindings = useApp((s) => s.intraoralFindings);
  const findings = filterByQuery(stateFindings, query, lang);
  const mioClassification = useApp((s) => s.mioClassification);
  const adjust = useApp((s) => s.intraoralAdjust);
  const analyzing = useApp((s) => s.analyzing) === "intraoral";
  const setIntraoralAdjust = useApp((s) => s.setIntraoralAdjust);
  const resetIntraoralAdjust = useApp((s) => s.resetIntraoralAdjust);
  const runIntraoral = useApp((s) => s.runIntraoral);
  const threshold = useApp((s) => s.threshold);
  const selectedFindingId = useApp((s) => s.selectedFindingId);
  const analyzedImageRef = useRef<string | null>(null);
  const [pane, setPane] = useState<"film" | "findings" | "report">("film");
  const gated = gateFindings(findings, threshold);
  const visible = gated.visible;
  const examDate = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    [lang],
  );

  useEffect(() => {
    if (image && image !== analyzedImageRef.current && !analyzing && stateFindings.length === 0) {
      analyzedImageRef.current = image;
      void runIntraoral(image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  useEffect(() => {
    if (selectedFindingId) setPane("findings");
  }, [selectedFindingId]);

  return (
    <div className="ws-page flex h-full min-h-0 flex-col gap-2.5 p-2.5 lg:p-3">
      <header className="ws-casebar flex flex-wrap items-center gap-3 px-3 py-2.5">
        <span className="text-sm font-semibold">{t(lang, "intraoral.ws.modality")}</span>
        <span className="hidden h-8 w-px bg-[#e8edf2] sm:block" />
        {mioClassification ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <Heart className="size-3.5 text-primary" />
            <Badge
              variant={
                mioClassification.class_name === "healthy"
                  ? "muted"
                  : mioClassification.class_name === "gingivitis"
                    ? "primary"
                    : "high"
              }
            >
              {mioClassification.class_name}
            </Badge>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {examDate}
        </span>

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
          modality="intraoral"
          variant="workstation"
          image={image}
          findings={visible}
          adjust={adjust}
          onAdjust={setIntraoralAdjust}
          onReset={resetIntraoralAdjust}
          onUpload={(url) => void runIntraoral(url)}
          analyzing={analyzing}
          dropLabel={t(lang, "common.dropIntra")}
          overlay={
            pane === "film" ? null : (
              <aside className="absolute inset-y-0 right-0 z-20 flex h-full w-[min(100%,22rem)] min-w-64 flex-col overflow-hidden border-l border-border bg-card xl:hidden">
                <FindingsPanel
                  modality="intraoral"
                  variant="workstation"
                  findings={visible}
                  forcedTab={pane === "report" ? "report" : "ai"}
                  withheldCount={gated.withheld.length}
                />
              </aside>
            )
          }
        />

        <aside className="ws-panel hidden min-h-0 flex-1 overflow-hidden xl:flex">
          <FindingsPanel
            modality="intraoral"
            variant="workstation"
            findings={visible}
            withheldCount={gated.withheld.length}
          />
        </aside>
      </div>
    </div>
  );
}
