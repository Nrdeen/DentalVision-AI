import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useRef } from "react";
import { FindingsSummary } from "@/components/analysis/findings-summary";
import { FindingsPanel } from "@/components/analysis/findings-panel";
import { ImageWorkspace } from "@/components/analysis/image-workspace";
import { filterByQuery } from "@/components/layout/app-shell";
import { t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/intraoral")({ component: IntraoralPage });

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
  const analyzedImageRef = useRef<string | null>(null);

  // Auto-analyze on mount if an image exists but hasn't been analyzed (mirrors the X-ray page).
  useEffect(() => {
    if (image && image !== analyzedImageRef.current && !analyzing && stateFindings.length === 0) {
      analyzedImageRef.current = image;
      void runIntraoral(image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);
  // Each real detection (already deduped by IoU at the data layer) gets its own card.
  console.log(`[INTRAORAL] State findings: ${stateFindings.length}, After filter: ${findings.length}`);
  console.log(`[INTRAORAL] Threshold: ${threshold}`);
  console.log(`[INTRAORAL] State findings list:`);
  stateFindings.forEach((f, i) => {
    console.log(`  ${i+1}. ${f.id} | ${f.key} | ${f.confidence.toFixed(4)} | bbox: [${f.bbox.map(b => b.toFixed(4)).join(', ')}]`);
  });
  const visible = findings.filter((f) => f.confidence >= threshold);
  const overlayFindings = findings.filter((f) => f.confidence >= threshold);
  console.log(`[INTRAORAL] Visible cards: ${visible.length}, Overlay findings: ${overlayFindings.length}`);
  console.log(`[INTRAORAL] Filtered out by threshold: ${findings.length - visible.length}`);
  findings.filter((f) => f.confidence < threshold).forEach((f, i) => {
    console.log(`  Filtered: ${f.id} | ${f.key} | conf: ${f.confidence.toFixed(4)} < threshold: ${threshold}`);
  });

  return (
    <div className="space-y-4">
      <FindingsSummary findings={visible} />
      
      {/* MIO Classification - Separate from detections */}
      {mioClassification && (
        <div className="card-surface rounded-2xl p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Heart className="size-4 text-primary" />
            MIO — Diş Eti / Periodontal Analiz
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Badge variant={mioClassification.class_name === 'healthy' ? 'muted' : mioClassification.class_name === 'gingivitis' ? 'primary' : 'high'}>
              {mioClassification.class_name.charAt(0).toUpperCase() + mioClassification.class_name.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {(mioClassification.confidence * 100).toFixed(1)}% confidence
            </span>
          </div>
        </div>
      )}
      
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <ImageWorkspace
            modality="intraoral"
            image={image}
            findings={overlayFindings}
            adjust={adjust}
            onAdjust={setIntraoralAdjust}
            onReset={resetIntraoralAdjust}
            onUpload={(url) => void runIntraoral(url)}
            analyzing={analyzing}
            dropLabel={t(lang, "common.dropIntra")}
          />
        </div>
        <FindingsPanel modality="intraoral" findings={visible} />
      </div>
    </div>
  );
}
