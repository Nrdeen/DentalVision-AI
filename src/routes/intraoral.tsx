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

function ToothScopeBar() {
  const lang = useApp((s) => s.language);
  const scope = useApp((s) => s.intraoralToothScope);
  const setScope = useApp((s) => s.setIntraoralToothScope);
  const [draft, setDraft] = useState(scope?.kind === "tooth" ? scope.fdi : "");
  const quadrants = [1, 2, 3, 4] as const;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs" title={t(lang, "intra.toothScopeHint")}>
      <span className="text-muted-foreground">{t(lang, "intra.toothScope")}</span>
      <button
        type="button"
        className="tab-btn"
        data-active={!scope}
        onClick={() => {
          setDraft("");
          setScope(null);
        }}
      >
        {t(lang, "intra.scopeClear")}
      </button>
      {quadrants.map((q) => (
        <button
          key={q}
          type="button"
          className="tab-btn"
          data-active={scope?.kind === "quadrant" && scope.quadrant === q}
          onClick={() => {
            setDraft("");
            setScope({ kind: "quadrant", quadrant: q });
          }}
        >
          {t(lang, "intra.scopeQ")}
          {q}
        </button>
      ))}
      <Input
        className="h-8 w-16 px-2"
        inputMode="numeric"
        maxLength={2}
        placeholder="16"
        value={draft}
        onChange={(event) => {
          const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
          setDraft(raw);
          if (!raw) {
            setScope(null);
            return;
          }
          if (/^[1-4][1-8]$/.test(raw)) setScope({ kind: "tooth", fdi: raw });
        }}
      />
    </div>
  );
}

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
    <div className="dx-main">
      <div className="dx-left">
      <header className="dx-case">
        <span className="dx-chip strong">{t(lang, "intraoral.ws.modality")}</span>
        <span className="hidden h-8 w-px bg-border sm:block" />
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
        <ToothScopeBar />

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
      </div>

      <aside className="dx-right hidden xl:flex">
        <FindingsPanel
          modality="intraoral"
          variant="workstation"
          findings={visible}
          withheldCount={gated.withheld.length}
        />
      </aside>
    </div>
  );
}
