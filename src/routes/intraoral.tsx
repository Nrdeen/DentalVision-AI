import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
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
    <div className="relative flex h-full min-h-0 flex-col">
      <ImageWorkspace
        modality="intraoral"
        image={image}
        findings={visible}
        adjust={adjust}
        onAdjust={setIntraoralAdjust}
        onReset={resetIntraoralAdjust}
        onUpload={(url) => void runIntraoral(url)}
        analyzing={analyzing}
        dropLabel={t(lang, "common.dropIntra")}
        leading={
          mioClassification ? (
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
          ) : null
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
                modality="intraoral"
                findings={visible}
                forcedTab={pane === "report" ? "report" : "ai"}
                withheldCount={gated.withheld.length}
              />
            </aside>
          )
        }
      />
    </div>
  );
}
