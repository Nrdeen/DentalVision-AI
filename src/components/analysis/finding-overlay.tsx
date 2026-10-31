import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { findingLabel, t } from "@/lib/dentaai/i18n";
import { contourInImage, type Point } from "@/lib/dentaai/tooth-contour";
import type { Finding, Lang } from "@/lib/dentaai/types";
import { toothDisplay } from "@/lib/dentaai/tooth-numbering";
import { cn } from "@/lib/utils";

type Size = { w: number; h: number };
type Pill = { left: number; top: number; w: number; h: number; cx: number; cy: number };

function fdiDigits(finding: Finding) {
  return toothDisplay(finding)?.match(/\d{2}/)?.[0] ?? "";
}

function fdiNumber(finding: Finding) {
  const raw = Number(fdiDigits(finding));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function isLargeMark(finding: Finding) {
  const [x1, y1, x2, y2] = finding.bbox;
  const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return finding.key === "impacted" || finding.key === "missingTooth" || finding.key === "implant" || area > 0.01;
}

function centroid(points: Point[] | undefined, bbox: Finding["bbox"]): Point {
  if (points && points.length) {
    const x = points.reduce((s, p) => s + p[0], 0) / points.length;
    const y = points.reduce((s, p) => s + p[1], 0) / points.length;
    return [x, y];
  }
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

function nearestPoint(points: Point[] | undefined, target: Point, bbox: Finding["bbox"]): Point {
  if (!points?.length) return centroid(undefined, bbox);
  let best = points[0];
  let bestD = Infinity;
  for (const p of points) {
    const d = (p[0] - target[0]) ** 2 + (p[1] - target[1]) ** 2;
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

function toothBlob(bbox: Finding["bbox"], upper: boolean): Point[] {
  const [x1, y1, x2, y2] = bbox;
  const cx = (x1 + x2) / 2;
  const w = Math.max(0.016, x2 - x1);
  const h = Math.max(0.055, y2 - y1);
  const left = cx - w * 0.72;
  const right = cx + w * 0.72;
  if (upper) {
    const crown = Math.min(0.62, y2 + h * 0.04);
    const neck = (y1 + y2) / 2;
    const tip = Math.max(0.04, y1 - h * 0.08);
    return [
      [left, crown],
      [cx, crown + h * 0.06],
      [right, crown],
      [right - w * 0.18, neck],
      [cx + w * 0.14, tip],
      [cx - w * 0.14, tip],
      [left + w * 0.18, neck],
    ];
  }
  const crown = Math.max(0.4, y1 - h * 0.04);
  const neck = (y1 + y2) / 2;
  const tip = Math.min(0.96, y2 + h * 0.08);
  return [
    [left, crown],
    [cx, crown - h * 0.06],
    [right, crown],
    [right - w * 0.18, neck],
    [cx + w * 0.14, tip],
    [cx - w * 0.14, tip],
    [left + w * 0.18, neck],
  ];
}

function outlineOf(finding: Finding, contour?: Point[]) {
  const tooth = fdiNumber(finding);
  const upper = tooth ? tooth < 30 : (finding.bbox[1] + finding.bbox[3]) / 2 < 0.48;
  if (contour && contour.length > 6) return contour;
  return toothBlob(finding.bbox, upper);
}

function placePills(findings: Finding[], box: Size, selectedId: string | null, lang: Lang) {
  const next: Record<string, Pill> = {};
  for (const side of [true, false]) {
    const row = findings
      .map((f) => {
        const tooth = fdiNumber(f);
        const [x1, y1, x2, y2] = f.bbox;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const upper = tooth ? tooth < 30 : cy < 0.48;
        const active = f.id === selectedId;
        const label = active
          ? t(lang, "clinic.chipDetail", {
              n: tooth || fdiDigits(f),
              name: findingLabel(lang, f.key),
              p: Math.round(f.confidence * 100),
            })
          : fdiDigits(f);
        const w = active ? Math.max(120, label.length * 7.2 + 18) : 40;
        return { f, tooth, upper, x1, y1, x2, y2, cx, cy, w, label };
      })
      .filter((item) => item.upper === side)
      .sort((a, b) => a.cx - b.cx)
      .map((item) => {
        const outward = item.cx > 0.5 ? 18 : -18;
        const cx = item.cx * box.w + outward;
        const cy = item.upper
          ? Math.max(18, item.y1 * box.h - 28)
          : Math.min(box.h - 16, item.y2 * box.h + 22);
        return { ...item, cx, cy };
      });

    for (let i = 1; i < row.length; i++) {
      const gap = (row[i - 1].w + row[i].w) / 2 + 10;
      if (row[i].cx < row[i - 1].cx + gap) row[i].cx = row[i - 1].cx + gap;
    }
    for (const item of row) {
      const left = Math.min(Math.max(4, item.cx - item.w / 2), box.w - item.w - 4);
      const top = Math.min(Math.max(4, item.cy - 10), box.h - 24);
      next[item.f.id] = { left, top, w: item.w, h: 20, cx: left + item.w / 2, cy: top + 10 };
    }
  }
  return next;
}

export function FindingOverlay({
  findings: allFindings,
  hiddenIds,
  lang,
  compact = false,
  selectedId,
  onSelect,
  filmImage = null,
}: {
  findings: Finding[];
  hiddenIds?: string[];
  lang: Lang;
  compact?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  filmImage?: HTMLImageElement | null;
}) {
  const findings = useMemo(
    () => (hiddenIds?.length ? allFindings.filter((f) => !hiddenIds.includes(f.id)) : allFindings),
    [allFindings, hiddenIds],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [container, setContainer] = useState<Size | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hover = useCallback((id: string) => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setHoveredId(id);
  }, []);
  const release = useCallback(() => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => setHoveredId(null), 140);
  }, []);
  useEffect(
    () => () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    },
    [],
  );

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setContainer((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const contours = useMemo(() => {
    if (!filmImage?.naturalWidth) return {} as Record<string, Point[]>;
    const next: Record<string, Point[]> = {};
    for (const f of findings) {
      if (f.source !== "xray") continue;
      if (f.mask && f.mask.length > 0) {
        next[f.id] = f.mask;
        continue;
      }
      const pts = contourInImage(filmImage, f.bbox);
      if (pts) next[f.id] = pts;
    }
    return next;
  }, [findings, filmImage]);

  const pills = useMemo(
    () => (container ? placePills(findings, container, selectedId ?? null, lang) : {}),
    [findings, container, selectedId, lang],
  );
  const focusId = selectedId ?? hoveredId ?? null;

  return (
    <div ref={rootRef} data-finding="root" className="pointer-events-none absolute inset-0">
      {container ? (
        <svg className="absolute inset-0 size-full overflow-visible" width={container.w} height={container.h}>
          {findings.map((f) => {
            const color = `var(${f.colorVar})`;
            const outline = outlineOf(f, contours[f.id]);
            const large = isLargeMark(f);
            const active = focusId === f.id;
            const dimmed = Boolean(!compact && selectedId && selectedId !== f.id);
            const pill = pills[f.id];
            const center = centroid(outline, f.bbox);
            const attach = large && pill
              ? nearestPoint(outline, [pill.cx / container.w, pill.cy / container.h], f.bbox)
              : center;
            const ax = attach[0] * container.w;
            const ay = attach[1] * container.h;
            const [x1, y1, x2, y2] = f.bbox;
            const rx = Math.max(11, ((x2 - x1) * container.w) * 0.55);
            const ry = Math.max(13, ((y2 - y1) * container.h) * 0.55);
            const interaction = compact
              ? {}
              : {
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation();
                    onSelect?.(f.id);
                  },
                  onPointerEnter: () => hover(f.id),
                  onPointerLeave: release,
                };

            return (
              <g
                key={f.id}
                className={cn(!compact && "pointer-events-auto cursor-pointer")}
                opacity={dimmed ? 0.28 : 0.92}
                {...interaction}
              >
                <polygon
                  points={outline.map(([x, y]) => `${x * container.w},${y * container.h}`).join(" ")}
                  fill="transparent"
                  stroke="none"
                />
                {large ? (
                  <polygon
                    className="ov-ls"
                    points={outline.map(([x, y]) => `${x * container.w},${y * container.h}`).join(" ")}
                    fill={color}
                    fillOpacity={active ? 0.5 : 0.38}
                    stroke={color}
                    strokeWidth={active ? 2.4 : 1.7}
                    strokeDasharray={f.key === "impacted" || f.key === "missingTooth" ? "5 3" : undefined}
                    strokeLinejoin="round"
                    strokeOpacity={f.key === "impacted" ? 1 : 0.55}
                    vectorEffect="non-scaling-stroke"
                    style={{ ["--k" as string]: color }}
                  />
                ) : (
                  <ellipse
                    className="ov-ls"
                    cx={center[0] * container.w}
                    cy={center[1] * container.h}
                    rx={rx}
                    ry={ry}
                    fill={color}
                    fillOpacity={active ? 0.55 : 0.5}
                    stroke={color}
                    strokeWidth={1.7}
                    strokeOpacity={0.55}
                    vectorEffect="non-scaling-stroke"
                    style={{ ["--k" as string]: color }}
                  />
                )}
                {!compact && pill ? (
                  <line
                    x1={ax}
                    y1={ay}
                    x2={pill.cx}
                    y2={pill.cy}
                    stroke={color}
                    strokeWidth={1.3}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
                <circle
                  cx={ax}
                  cy={ay}
                  r={3.6}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.6}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      ) : null}

      {!compact && container
        ? findings.map((f) => {
            const tooth = fdiDigits(f);
            const pill = pills[f.id];
            if (!tooth || !pill) return null;
            const active = selectedId === f.id;
            const dimmed = Boolean(selectedId && selectedId !== f.id);
            const label = active
              ? t(lang, "clinic.chipDetail", {
                  n: tooth,
                  name: findingLabel(lang, f.key),
                  p: Math.round(f.confidence * 100),
                })
              : tooth;
            return (
              <button
                key={`pill-${f.id}`}
                type="button"
                aria-label={`${tooth} ${findingLabel(lang, f.key)}`}
                className={cn("ov-pill", active && "wide")}
                style={{
                  left: pill.left,
                  top: pill.top,
                  width: pill.w,
                  ["--k" as string]: `var(${f.colorVar})`,
                  opacity: dimmed ? 0.35 : 1,
                  zIndex: active ? 8 : 4,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect?.(f.id);
                }}
                onPointerEnter={() => hover(f.id)}
                onPointerLeave={release}
              >
                <span>{label}</span>
              </button>
            );
          })
        : null}
    </div>
  );
}
