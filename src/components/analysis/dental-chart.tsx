import { useApp } from "@/lib/dentaai/store";
import { findingLabel } from "@/lib/dentaai/i18n";
import type { Finding, Severity } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Tooth width by position from the midline (1 = central incisor … 8 = third molar).
const WIDTH = [0, 14, 12, 13, 12, 12, 17, 17, 16];
const SLOT = 18.4;
const MID_GAP = 10;
const PAD = 12;
const CHART_W = PAD * 2 + SLOT * 16 + MID_GAP;
const TOOTH_H = 44;
const UPPER_Y = 20;
const LOWER_Y = 92;

const RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
const SEV_VAR: Record<Severity, string> = {
  high: "var(--color-high)",
  medium: "var(--color-medium)",
  low: "var(--color-low)",
};

type Mark = { severity: Severity; colorVar: string; ids: string[]; estimated: boolean };

function worst(a: Severity | undefined, b: Severity): Severity {
  return a && RANK[a] >= RANK[b] ? a : b;
}

function add(map: Map<number, Mark>, key: number, f: Finding, estimated = false) {
  const prev = map.get(key);
  map.set(key, {
    severity: worst(prev?.severity, f.severity),
    colorVar: prev?.colorVar ?? f.colorVar,
    ids: [...(prev?.ids ?? []), f.id],
    estimated: (prev?.estimated ?? true) && estimated,
  });
}

// FDI quadrant (1 upper right … 4 lower right) from a position key such as "upperRightRegion".
function quadrantOf(positionKey: string): number | null {
  const upper = /upper/i.test(positionKey);
  const lower = /lower/i.test(positionKey);
  const right = /right/i.test(positionKey);
  const left = /left/i.test(positionKey);
  if (upper === lower || right === left) return null;
  if (upper) return right ? 1 : 2;
  return left ? 3 : 4;
}

function toothX(i: number) {
  return PAD + i * SLOT + (i >= 8 ? MID_GAP : 0);
}

function archY(index: number) {
  const distanceFromCenter = Math.abs(7.5 - index) / 7.5;
  return Math.round(distanceFromCenter * distanceFromCenter * 12);
}

function Tooth({
  fdi,
  index,
  upper,
  mark,
  selected,
  onClick,
  title,
}: {
  fdi: number;
  index: number;
  upper: boolean;
  mark?: Mark;
  selected: boolean;
  onClick: () => void;
  title: string;
}) {
  const pos = index < 8 ? 8 - index : index - 7;
  const w = WIDTH[pos];
  const x = toothX(index) + (SLOT - w) / 2;
  const y = (upper ? UPPER_Y : LOWER_Y) + archY(index);
  const crownH = TOOTH_H * 0.52;
  const crownY = upper ? y + TOOTH_H - crownH : y;
  const rootBase = upper ? crownY : crownY + crownH;
  const rootTip = upper ? y : y + TOOTH_H;
  const color = mark ? `var(${mark.colorVar})` : undefined;

  return (
    <g
      className={cn(mark ? "cursor-pointer" : "pointer-events-none")}
      onClick={mark ? onClick : undefined}
      role={mark ? "button" : undefined}
      aria-label={mark ? title : undefined}
    >
      <title>{title}</title>
      <path
        d={`M ${x + w * 0.2} ${rootBase} L ${x + w * 0.5} ${rootTip} L ${x + w * 0.8} ${rootBase} Z`}
        fill={color ? `color-mix(in oklab, ${color} 22%, white)` : "#f1f5f9"}
        stroke={color ?? "#cbd5e1"}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <rect
        x={x}
        y={crownY}
        width={w}
        height={crownH}
        rx={4}
        fill={color ? `color-mix(in oklab, ${color} 55%, white)` : "#f8fafc"}
        stroke={color ?? "#cbd5e1"}
        strokeWidth={selected ? 2 : 1}
        strokeDasharray={mark?.estimated ? "2.5 1.8" : undefined}
      />
      {selected ? (
        <rect
          x={x - 2}
          y={crownY - 2}
          width={w + 4}
          height={crownH + 4}
          rx={6}
          fill="none"
          stroke={color}
          strokeOpacity={0.45}
          strokeWidth={2}
        />
      ) : null}
      <text
        x={x + w / 2}
        y={upper ? UPPER_Y - 6 : LOWER_Y + TOOTH_H + 12}
        textAnchor="middle"
        className={cn("select-none", mark ? "fill-foreground font-bold" : "fill-muted-foreground")}
        style={{ fontSize: 8 }}
      >
        {fdi}
      </text>
    </g>
  );
}

// Region-level findings (no tooth number) tint the whole quadrant instead of faking a tooth.
function QuadrantPanel({
  q,
  region,
  selected,
  title,
  onClick,
}: {
  q: number;
  region: Mark;
  selected: boolean;
  title: string;
  onClick: () => void;
}) {
  const upper = q <= 2;
  const right = q === 1 || q === 4;
  const x1 = right ? PAD - 4 : toothX(8) - 4;
  const x2 = right ? toothX(7) + SLOT + 4 : toothX(15) + SLOT + 4;
  const y1 = upper ? UPPER_Y - 14 : LOWER_Y - 4;
  const y2 = upper ? UPPER_Y + TOOTH_H + 4 : LOWER_Y + TOOTH_H + 16;
  const color = `var(${region.colorVar})`;
  const bx = right ? x1 : x2;
  const by = upper ? y1 : y2;

  return (
    <g className="cursor-pointer" onClick={onClick} role="button" aria-label={title}>
      <title>{title}</title>
      <rect
        x={x1}
        y={y1}
        width={x2 - x1}
        height={y2 - y1}
        rx={8}
        fill={`color-mix(in oklab, ${color} ${selected ? 20 : 11}%, white)`}
        stroke={color}
        strokeOpacity={selected ? 0.9 : 0.45}
        strokeWidth={selected ? 1.6 : 1}
        strokeDasharray={selected ? undefined : "3 2.5"}
      />
      <circle cx={bx} cy={by} r={7.5} fill={color} stroke="white" strokeWidth={1.5} />
      <text
        x={bx}
        y={by + 3}
        textAnchor="middle"
        className="select-none fill-white"
        style={{ fontSize: 9, fontWeight: 700 }}
      >
        {region.ids.length}
      </text>
    </g>
  );
}

export function DentalChart({
  findings,
  tr,
  compact = false,
}: {
  findings: Finding[];
  tr: boolean;
  compact?: boolean;
}) {
  const selectedId = useApp((s) => s.selectedFindingId);
  const select = useApp((s) => s.setSelectedFindingId);

  if (findings.length === 0) {
    return compact ? (
      <p className="px-1 text-xs text-muted-foreground">{tr ? "İşaretli diş yok." : "No marked teeth yet."}</p>
    ) : null;
  }

  const teeth = new Map<number, Mark>();
  const quads = new Map<number, Mark>();
  for (const f of findings) {
    const confirmed = (f.tooth.match(/\b[1-4][1-8]\b/g) ?? []).map(Number);
    const numbers = confirmed.length ? confirmed : (f.toothEst ?? []).map(Number);
    if (numbers.length) {
      numbers.forEach((n) => add(teeth, n, f, confirmed.length === 0));
    } else {
      const q = quadrantOf(f.positionKey);
      if (q) add(quads, q, f);
    }
  }

  const selectedFinding = findings.find((f) => f.id === selectedId);

  const jump = (ids: string[]) => {
    const i = ids.indexOf(selectedId ?? "");
    select(ids[(i + 1) % ids.length]);
  };

  const sevLabel = (s: Severity) =>
    s === "high" ? (tr ? "Yüksek" : "High") : s === "medium" ? (tr ? "Orta" : "Medium") : tr ? "Düşük" : "Low";

  const typeLegend = [...new Map(findings.map((f) => [f.colorVar, f])).values()].slice(0, 5);

  const row = (numbers: number[], upper: boolean) =>
    numbers.map((fdi, i) => {
      const mark = teeth.get(fdi);
      return (
        <Tooth
          key={fdi}
          fdi={fdi}
          index={i}
          upper={upper}
          mark={mark}
          selected={Boolean(mark && selectedFinding && mark.ids.includes(selectedFinding.id))}
          onClick={() => mark && jump(mark.ids)}
          title={
            mark
              ? `${mark.estimated ? "≈" : ""}${fdi} · ${mark.ids.length} ${tr ? "bulgu" : "finding(s)"}`
              : String(fdi)
          }
        />
      );
    });

  return (
    <div className={cn(compact ? "rounded-xl bg-transparent p-0" : "mb-3 rounded-xl border border-border bg-card p-3")}>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold">{tr ? "Diş şeması (FDI)" : "Dental chart (FDI)"}</p>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          {(["high", "medium", "low"] as Severity[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ background: SEV_VAR[s] }} />
              {sevLabel(s)}
            </span>
          ))}
        </div>
      </div>
      {compact ? null : (
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          {typeLegend.map((f) => (
            <span key={f.colorVar} className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ background: `var(${f.colorVar})` }} />
              {findingLabel(tr ? "tr" : "en", f.key)}
            </span>
          ))}
        </div>
      )}
      <svg viewBox={`0 0 ${CHART_W} 158`} className="w-full" role="group" aria-label="FDI dental chart">
        <path
          d={`M ${PAD - 2} 72 Q ${CHART_W / 2} 2 ${CHART_W - PAD + 2} 72 L ${CHART_W - PAD + 2} 79 Q ${CHART_W / 2} 18 ${PAD - 2} 79 Z`}
          fill="#fff1f2"
          stroke="#fecdd3"
          strokeWidth="0.8"
        />
        <path
          d={`M ${PAD - 2} 86 Q ${CHART_W / 2} 156 ${CHART_W - PAD + 2} 86 L ${CHART_W - PAD + 2} 79 Q ${CHART_W / 2} 140 ${PAD - 2} 79 Z`}
          fill="#fff1f2"
          stroke="#fecdd3"
          strokeWidth="0.8"
        />
        {[1, 2, 3, 4].map((q) => {
          const region = quads.get(q);
          if (!region) return null;
          return (
            <QuadrantPanel
              key={q}
              q={q}
              region={region}
              selected={Boolean(selectedFinding && region.ids.includes(selectedFinding.id))}
              title={`Q${q} · ${region.ids.length} ${tr ? "bulgu (bölge)" : "finding(s) (region)"} · ${sevLabel(region.severity)}`}
              onClick={() => jump(region.ids)}
            />
          );
        })}
        <text x={3} y={86} className="fill-muted-foreground" style={{ fontSize: 8, fontWeight: 700 }}>
          R
        </text>
        <text x={CHART_W - 9} y={86} className="fill-muted-foreground" style={{ fontSize: 8, fontWeight: 700 }}>
          L
        </text>
        <line x1={PAD} x2={CHART_W - PAD} y1={79} y2={79} stroke="#e2e8f0" strokeWidth={0.8} strokeDasharray="3 3" />
        {row(UPPER, true)}
        {row(LOWER, false)}
      </svg>
      {!compact && [...teeth.values()].some((m) => m.estimated) ? (
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
          {tr
            ? "≈ Kesikli çizgili dişler: numara kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)."
            : "≈ Dashed teeth: numbers are estimated from arch geometry (not model output)."}
        </p>
      ) : null}
      {!compact && quads.size > 0 ? (
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
          {tr
            ? "Renkli bölgeler, bulgunun görüntüdeki konumundan türetilir; model diş numarası üretmez."
            : "Tinted regions are derived from each finding's position in the image; the model does not number teeth."}
        </p>
      ) : null}
    </div>
  );
}
