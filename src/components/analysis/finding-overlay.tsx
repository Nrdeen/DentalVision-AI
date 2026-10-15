import { Tag } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { findingLabel } from "@/lib/dentaai/i18n";
import type { Finding, Lang } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";
import { toothDisplay } from "@/lib/dentaai/tooth-numbering";

type Size = { w: number; h: number };
type Rect = { left: number; top: number; w: number; h: number };
type Pos = { left: number; top: number };

const GAP = 3;
const MARGIN = 2;
const PIN_SIZE = 18;
const HOVER_RELEASE_MS = 140;

function overlapArea(a: Rect, b: Rect, margin = 0) {
  const ox = Math.min(a.left + a.w, b.left + b.w) - Math.max(a.left, b.left) + margin;
  const oy = Math.min(a.top + a.h, b.top + b.h) - Math.max(a.top, b.top) + margin;
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

function clampRect(left: number, top: number, size: Size, container: Size): Rect {
  return {
    left: Math.min(Math.max(0, left), Math.max(0, container.w - size.w)),
    top: Math.min(Math.max(0, top), Math.max(0, container.h - size.h)),
    w: size.w,
    h: size.h,
  };
}

function toothOutlinePath(bbox: Finding["bbox"]) {
  const [x1, y1, x2, y2] = bbox.map((value) => value * 100);
  const width = x2 - x1;
  const height = y2 - y1;
  const left = x1 + width * 0.14;
  const right = x2 - width * 0.14;
  const center = (left + right) / 2;
  const upper = (y1 + y2) / 2 < 48;
  const crownTop = upper ? y1 + height * 0.42 : y1 + height * 0.08;
  const crownBottom = upper ? y2 - height * 0.08 : y1 + height * 0.58;
  const rootTip = upper ? y1 + height * 0.04 : y2 - height * 0.04;
  const rootShoulder = upper ? crownTop : crownBottom;
  const rootDirection = upper ? -1 : 1;

  return [
    `M ${left} ${crownBottom}`,
    `Q ${left - width * 0.02} ${crownTop} ${left + width * 0.24} ${crownTop}`,
    `Q ${center} ${crownTop - height * 0.08} ${right - width * 0.24} ${crownTop}`,
    `Q ${right + width * 0.02} ${crownTop} ${right} ${crownBottom}`,
    `L ${center + width * 0.16} ${rootShoulder}`,
    `Q ${center + width * 0.12} ${rootTip + rootDirection * height * 0.02} ${center + width * 0.06} ${rootTip}`,
    `Q ${center} ${rootTip + rootDirection * height * 0.08} ${center - width * 0.06} ${rootTip}`,
    `Q ${center - width * 0.12} ${rootTip + rootDirection * height * 0.02} ${center - width * 0.16} ${rootShoulder}`,
    "Z",
  ].join(" ");
}

// Visual-only placement: bbox/mask data is read, never modified.
function placeNearBoxes(
  findings: Finding[],
  sizeOf: (f: Finding) => Size | undefined,
  container: Size,
  priorityId?: string | null,
): Record<string, Pos> {
  const placed: Rect[] = [];
  const result: Record<string, Pos> = {};
  const order = [...findings].sort(
    (a, b) => Number(b.id === priorityId) - Number(a.id === priorityId),
  );

  for (const f of order) {
    const size = sizeOf(f);
    if (!size) continue;
    const { w, h } = size;
    const [bx1, by1, bx2, by2] = f.bbox;
    const x1 = bx1 * container.w;
    const y1 = by1 * container.h;
    const x2 = bx2 * container.w;
    const y2 = by2 * container.h;

    const candidates: Array<[number, number]> = [
      [x1, y1 - h - GAP], // above
      [x2 - w, y1 - h - GAP], // above right
      [x1 - w, y1 - h - GAP], // above left
      [x2 + GAP, y1], // right
      [x1 - w - GAP, y1], // left
      [x1, y2 + GAP], // below
      [x2 - w, y2 + GAP], // below right
      [x1 - w, y2 + GAP], // below left
      // Last resort: stack above, still hugging the box.
      [x1, y1 - 2 * h - GAP - MARGIN],
      [x1, y1 - 3 * h - GAP - 2 * MARGIN],
    ];

    let best: Rect | null = null;
    let bestScore = Infinity;
    for (const [cx, cy] of candidates) {
      const rect = clampRect(cx, cy, size, container);
      const score = placed.reduce((sum, p) => sum + overlapArea(rect, p, MARGIN), 0);
      if (score < bestScore) {
        best = rect;
        bestScore = score;
        if (score === 0) break;
      }
    }
    if (best) {
      placed.push(best);
      result[f.id] = { left: best.left, top: best.top };
    }
  }
  return result;
}

export function FindingOverlay({
  findings: allFindings,
  hiddenIds,
  lang,
  compact = false,
  selectedId,
  onSelect,
}: {
  findings: Finding[];
  hiddenIds?: string[];
  lang: Lang;
  compact?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  // Hidden detections are skipped, but pin numbers keep the original order.
  const findings = useMemo(
    () => (hiddenIds?.length ? allFindings.filter((f) => !hiddenIds.includes(f.id)) : allFindings),
    [allFindings, hiddenIds],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [container, setContainer] = useState<Size | null>(null);
  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Pins (numbered markers) keep dense images clean; "all labels" is opt-in.
  const [showAll, setShowAll] = useState(false);

  const hover = useCallback((id: string) => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setHoveredId(id);
  }, []);
  const release = useCallback(() => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => setHoveredId(null), HOVER_RELEASE_MS);
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

  // Measure real label sizes (layout size, unaffected by parent zoom transforms).
  useLayoutEffect(() => {
    const next: Record<string, Size> = {};
    let changed = false;
    for (const f of findings) {
      const el = labelRefs.current[f.id];
      if (!el) continue;
      const size = { w: el.offsetWidth, h: el.offsetHeight };
      next[f.id] = size;
      const prev = sizes[f.id];
      if (!prev || prev.w !== size.w || prev.h !== size.h) changed = true;
    }
    if (changed) setSizes(next);
  });

  const focusId = hoveredId ?? selectedId ?? null;

  const pinPositions = useMemo(
    () =>
      container
        ? placeNearBoxes(findings, () => ({ w: PIN_SIZE, h: PIN_SIZE }), container, selectedId)
        : {},
    [findings, container, selectedId],
  );

  const labelPositions = useMemo(
    () => (container ? placeNearBoxes(findings, (f) => sizes[f.id], container, focusId) : {}),
    [findings, sizes, container, focusId],
  );

  // A focused pin expands in place into its full label.
  const expandedPos = (id: string): Pos | undefined => {
    const pin = pinPositions[id];
    const size = sizes[id];
    if (!pin || !size || !container) return undefined;
    const r = clampRect(pin.left, pin.top, size, container);
    return { left: r.left, top: r.top };
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {findings.map((f) => {
          const active = focusId === f.id;
          const dimmed = !compact && hoveredId !== null && hoveredId !== f.id;
          const interaction = {
            onClick: () => onSelect?.(f.id),
            onPointerEnter: () => hover(f.id),
            onPointerLeave: release,
          };

          // Render segmentation mask if available
          if (f.mask && f.mask.length > 0) {
            const points = f.mask.map(([x, y]) => `${x * 100} ${y * 100}`).join(" ");
            return (
              <g key={f.id} style={{ opacity: dimmed ? 0.35 : 1, transition: "opacity 150ms" }}>
                <polygon
                  points={points}
                  fill={`var(${f.colorVar})`}
                  fillOpacity={active ? "0.25" : "0.15"}
                  stroke={`var(${f.colorVar})`}
                  strokeWidth="0.8"
                  className={cn(!compact && "pointer-events-auto cursor-pointer", active && "stroke-[1.0]")}
                  {...(compact ? {} : interaction)}
                />
              </g>
            );
          }

          // This is only a visual approximation of the model bbox, not a tooth
          // boundary or a disease segmentation mask.
          const [x1, y1, x2, y2] = f.bbox;
          return (
            <g key={f.id} style={{ opacity: dimmed ? 0.35 : 1, transition: "opacity 150ms" }}>
              {f.source === "xray" ? (
                <path
                  d={toothOutlinePath(f.bbox)}
                  fill={`var(${f.colorVar})`}
                  fillOpacity={active ? "0.34" : "0.2"}
                  stroke={`var(${f.colorVar})`}
                  strokeWidth={active ? "1.8" : "1.35"}
                  strokeDasharray="3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  aria-label={
                    lang === "tr"
                      ? "Model sınırlayıcı kutusunun yaklaşık görseli; diş veya lezyon sınırı değildir"
                      : "Approximation of the model bounding box; not a tooth or lesion boundary"
                  }
                  className={cn(!compact && "pointer-events-auto cursor-pointer")}
                  {...(compact ? {} : interaction)}
                />
              ) : (
                <rect
                  x={`${x1 * 100}%`}
                  y={`${y1 * 100}%`}
                  width={`${(x2 - x1) * 100}%`}
                  height={`${(y2 - y1) * 100}%`}
                  fill="transparent"
                  stroke={`var(${f.colorVar})`}
                  strokeWidth="0.8"
                  className={cn(!compact && "pointer-events-auto cursor-pointer")}
                  {...(compact ? {} : interaction)}
                />
              )}
            </g>
          );
        })}
      </svg>

      {!compact && (
        <div className="absolute inset-0 pointer-events-none">
          {findings.map((f) => {
            const index = allFindings.indexOf(f);
            const active = hoveredId === f.id;
            const selected = selectedId === f.id;
            const expanded = showAll || active;
            const pos = showAll ? labelPositions[f.id] : active ? expandedPos(f.id) : undefined;
            const pin = pinPositions[f.id];
            const dimmed = hoveredId !== null && !active;

            return (
              <div key={f.id}>
                {/* Full label: always mounted so it can be measured; visible when expanded. */}
                <div
                  ref={(el) => {
                    labelRefs.current[f.id] = el;
                  }}
                  className="pointer-events-auto absolute inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{
                    left: pos?.left ?? 0,
                    top: pos?.top ?? 0,
                    visibility: expanded && pos ? "visible" : "hidden",
                    zIndex: active ? 30 : 10,
                    backgroundColor: `var(${f.colorVar})`,
                    opacity: dimmed && showAll ? 0.55 : active ? 1 : 0.92,
                    boxShadow: active ? "0 2px 6px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.15)",
                  }}
                  onClick={() => onSelect?.(f.id)}
                  onPointerEnter={() => hover(f.id)}
                  onPointerLeave={release}
                >
                  <span className="grid size-3.5 place-items-center rounded-full bg-white/25 text-[9px] font-bold">
                    {index + 1}
                  </span>
                  {toothDisplay(f) ? <span>{toothDisplay(f)}</span> : null}
                  <span>{findingLabel(lang, f.key)}</span>
                  <span>·</span>
                  <span>{Math.round(f.confidence * 100)}%</span>
                </div>

                {!showAll && (
                  <button
                    type="button"
                    aria-label={`${index + 1}. ${findingLabel(lang, f.key)}`}
                    className="pointer-events-auto absolute grid cursor-pointer place-items-center rounded-full text-[10px] font-bold leading-none text-white ring-[1.5px] ring-white transition duration-150"
                    style={{
                      width: PIN_SIZE,
                      height: PIN_SIZE,
                      left: pin?.left ?? 0,
                      top: pin?.top ?? 0,
                      visibility: pin && !active ? "visible" : "hidden",
                      zIndex: 20,
                      backgroundColor: `var(${f.colorVar})`,
                      opacity: dimmed ? 0.6 : 1,
                      transform: selected ? "scale(1.25)" : undefined,
                      boxShadow: selected
                        ? `0 0 0 4px color-mix(in oklab, var(${f.colorVar}) 35%, transparent), 0 2px 6px rgba(0,0,0,0.5)`
                        : "0 1px 3px rgba(0,0,0,0.45)",
                    }}
                    onClick={() => onSelect?.(f.id)}
                    onPointerEnter={() => hover(f.id)}
                    onPointerLeave={release}
                    onFocus={() => hover(f.id)}
                    onBlur={release}
                  >
                    {index + 1}
                  </button>
                )}
              </div>
            );
          })}

          {findings.length > 1 && (
            <button
              type="button"
              title={showAll ? "Pin" : "Labels"}
              aria-pressed={showAll}
              className={cn(
                "pointer-events-auto absolute left-2 top-2 z-40 inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white backdrop-blur transition-colors",
                showAll ? "bg-primary" : "bg-black/55 hover:bg-black/75",
              )}
              onClick={() => setShowAll((v) => !v)}
            >
              <Tag className="size-3" />
              {findings.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
