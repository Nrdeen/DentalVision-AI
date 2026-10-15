import { createFileRoute } from "@tanstack/react-router";
import { FindingsSummary } from "@/components/analysis/findings-summary";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";
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
  const visible = filterByQuery(findings, query, lang).filter((f) => f.confidence >= threshold);
  const analyzedImageRef = useRef<string | null>(null);

  // Auto-analyze on mount if image exists but hasn't been analyzed
  useEffect(() => {
    if (image && image !== analyzedImageRef.current && !analyzing && findings.length === 0) {
      analyzedImageRef.current = image;
      void runXray(image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  return (
    <div className="space-y-4">
      <FindingsSummary findings={visible} />
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
