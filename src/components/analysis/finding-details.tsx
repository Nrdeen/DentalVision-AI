import { ShieldAlert } from "lucide-react";
import { ConfidenceRing } from "@/components/analysis/confidence-ring";
import { positionLabel, t } from "@/lib/dentaai/i18n";
import { isToothEstimated, toothDisplay } from "@/lib/dentaai/tooth-numbering";
import { reliabilityLabel, suggestedApproach } from "@/lib/dentaai/clinical";
import type { Finding, Lang, Modality } from "@/lib/dentaai/types";

export function FindingDetails({
  finding,
  lang,
  modality,
}: {
  finding: Finding;
  lang: Lang;
  modality: Modality;
}) {
  const tr = lang === "tr";
  const [x1, y1, x2, y2] = finding.bbox;
  const areaPct = Math.max(0, (x2 - x1) * (y2 - y1) * 100);
  const action = suggestedApproach(finding.key, lang);

  const source =
    modality === "xray"
      ? tr
        ? "Panoramik röntgen"
        : "Panoramic X-ray"
      : tr
        ? "Ağız içi fotoğraf"
        : "Intraoral photo";
  const outline = finding.mask?.length
    ? tr
      ? "Segmentasyon maskesi"
      : "Segmentation mask"
    : tr
      ? "Sınırlayıcı kutu"
      : "Bounding box";

  const rows: Array<[string, string]> = [
    [t(lang, "common.toothNo"), toothDisplay(finding) ?? "—"],
    [tr ? "Bölge" : "Region", positionLabel(lang, finding.positionKey)],
    [tr ? "Kaynak" : "Source", source],
    [tr ? "Kapsanan alan" : "Covered area", `${areaPct.toFixed(1)}%`],
    [tr ? "Sınırlama" : "Outline", outline],
  ];

  return (
    <div className="finding-card-in space-y-3 px-3 pb-3 pt-1">
      <div className="flex items-center gap-3">
        <ConfidenceRing value={finding.confidence} colorVar={finding.colorVar} size={52} />
        <p className="text-xs text-muted-foreground">{reliabilityLabel(finding.confidence, lang)}</p>
      </div>

      <dl className="divide-y divide-border/60 rounded-lg border border-border/60 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-3 py-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div
        className="rounded-lg px-3 py-2 text-xs leading-relaxed"
        style={{ background: `color-mix(in oklab, var(${finding.colorVar}) 9%, white)` }}
      >
        <p className="mb-0.5 font-semibold">{tr ? "Önerilen yaklaşım" : "Suggested approach"}</p>
        <p className="text-foreground/80">{action}</p>
      </div>

      {isToothEstimated(finding) ? (
        <p className="flex gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <ShieldAlert className="mt-px size-3 shrink-0" />
          {tr
            ? "≈ Diş numarası, kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)."
            : "≈ Tooth number is estimated from arch geometry (not model output)."}
        </p>
      ) : null}
    </div>
  );
}
