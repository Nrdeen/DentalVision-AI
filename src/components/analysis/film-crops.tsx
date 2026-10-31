import { useEffect, useMemo, useState } from "react";
import { findingLabel, t } from "@/lib/dentaai/i18n";
import { contourInImage, type Point } from "@/lib/dentaai/tooth-contour";
import { fdiOf } from "@/lib/dentaai/tooth-numbering";
import type { Finding, Lang } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

type Crop = {
  tooth: number;
  findings: Finding[];
};

function groupByTooth(findings: Finding[]): Crop[] {
  const map = new Map<number, Finding[]>();
  for (const f of findings) {
    const tooth = fdiOf(f);
    if (!tooth) continue;
    const list = map.get(tooth) ?? [];
    list.push(f);
    map.set(tooth, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tooth, list]) => ({ tooth, findings: list }));
}

function cropWindow(bbox: Finding["bbox"]) {
  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = (bbox[1] + bbox[3]) / 2;
  const cw = 0.072;
  const ch = 0.344;
  return {
    left: Math.max(0, Math.min(1 - cw, cx - cw / 2)),
    top: Math.max(0, Math.min(1 - ch, cy - ch / 2)),
    cw,
    ch,
  };
}

function toView(points: Point[], win: ReturnType<typeof cropWindow>) {
  return points
    .map(([x, y]) => `${((x - win.left) / win.cw) * 90},${((y - win.top) / win.ch) * 130}`)
    .join(" ");
}

export function FilmCrops({
  image,
  findings,
  lang,
  selectedTooth,
  onPick,
}: {
  image: string | null;
  findings: Finding[];
  lang: Lang;
  selectedTooth: number | null;
  onPick: (tooth: number) => void;
}) {
  const crops = useMemo(() => groupByTooth(findings), [findings]);
  const [shapes, setShapes] = useState<Record<number, Point[]>>({});

  useEffect(() => {
    if (!image || crops.length === 0) {
      setShapes({});
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const next: Record<number, Point[]> = {};
      for (const crop of crops) {
        const pts = contourInImage(img, crop.findings[0].bbox);
        if (pts?.length) next[crop.tooth] = pts;
      }
      setShapes(next);
    };
    img.src = image;
  }, [image, crops]);

  if (!image) return null;

  return (
    <section className="pc">
      <h2>{t(lang, "clinic.cropsTitle")}</h2>
      <p>{t(lang, "clinic.cropsHint")}</p>
      {crops.length ? (
        <div className="cs">
          {crops.map((crop) => {
            const lead = crop.findings[0];
            const color = `var(${lead.colorVar})`;
            const win = cropWindow(lead.bbox);
            const shape = shapes[crop.tooth];
            const cx = ((((lead.bbox[0] + lead.bbox[2]) / 2) - win.left) / win.cw) * 90;
            const cy = ((((lead.bbox[1] + lead.bbox[3]) / 2) - win.top) / win.ch) * 130;
            return (
              <button
                key={crop.tooth}
                type="button"
                className={cn("cd", selectedTooth === crop.tooth && "on")}
                onClick={() => onPick(crop.tooth)}
              >
                <svg viewBox="0 0 90 130" aria-hidden>
                  <image
                    href={image}
                    x={-win.left * (90 / win.cw)}
                    y={-win.top * (130 / win.ch)}
                    width={90 / win.cw}
                    height={130 / win.ch}
                    preserveAspectRatio="none"
                    style={{ filter: "contrast(125%) brightness(105%)" }}
                  />
                  {shape ? (
                    <polygon
                      className="ct"
                      points={toView(shape, win)}
                      fill={color}
                      fillOpacity={0.42}
                      stroke={color}
                      strokeWidth="1.6"
                      strokeDasharray="3 2"
                      style={{ ["--k" as string]: color, filter: "drop-shadow(0 0 2px var(--k))" }}
                    />
                  ) : (
                    <ellipse
                      className="ct"
                      cx={cx}
                      cy={cy}
                      rx={Math.max(6, ((lead.bbox[2] - lead.bbox[0]) / win.cw) * 40)}
                      ry={Math.max(6, ((lead.bbox[3] - lead.bbox[1]) / win.ch) * 40)}
                      fill={color}
                      fillOpacity={0.42}
                      stroke={color}
                      strokeWidth="1.6"
                      strokeDasharray="3 2"
                      style={{ ["--k" as string]: color, filter: "drop-shadow(0 0 2px var(--k))" }}
                    />
                  )}
                </svg>
                <b>{t(lang, "clinic.tooth", { n: crop.tooth })}</b>
                <span>{crop.findings.map((f) => findingLabel(lang, f.key)).join(", ")}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
