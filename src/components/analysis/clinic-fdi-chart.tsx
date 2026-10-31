import { findingLabel, t } from "@/lib/dentaai/i18n";
import { fdiOf } from "@/lib/dentaai/tooth-numbering";
import type { Finding, FindingKey, Lang } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const K = 1.1;
const MOLAR =
  "M-27,-3 Q-25,5 -17,2 Q-11,-3 -5,3 Q0,6 5,3 Q11,-3 17,2 Q25,5 27,-3 Q29,-20 24,-35 Q0,-41 -24,-35 Q-29,-20 -27,-3Z";
const MOLAR_ROOT =
  "M-23,-35 C-25,-55 -22,-72 -15,-86 C-10,-72 -8,-52 -4,-35 L4,-35 C8,-52 10,-72 15,-86 C22,-72 25,-55 23,-35 Z";
const MOLAR_GUM = ["M-15,-6 Q-7,-15 0,-9 Q7,-15 15,-6", "M0,-9 V-24"];
const PALATAL = "M-3,-35 C-3,-55 -1,-72 0,-82 C1,-72 3,-55 3,-35Z";

const SH: Record<number, { w: number; c: string; r: string; g: string[] }> = {
  1: {
    w: 36,
    c: "M-15,-1 Q-17,-18 -13,-35 Q0,-41 13,-35 Q17,-18 15,-1 Q0,3 -15,-1Z",
    r: "M-10,-35 C-10,-58 -5,-82 0,-94 C5,-82 10,-58 10,-35Z",
    g: ["M-5,-6 V-30", "M5,-6 V-30"],
  },
  2: {
    w: 30,
    c: "M-12,-1 Q-14,-18 -11,-34 Q0,-39 11,-34 Q14,-18 12,-1 Q0,3 -12,-1Z",
    r: "M-8,-34 C-8,-58 -4,-80 1,-92 C5,-80 8,-58 8,-34Z",
    g: ["M-4,-6 V-28"],
  },
  3: {
    w: 36,
    c: "M-14,-5 Q-16,-20 -12,-35 Q0,-41 12,-35 Q16,-20 14,-5 L0,7 Z",
    r: "M-9,-35 C-9,-62 -4,-90 0,-104 C4,-90 9,-62 9,-35Z",
    g: ["M0,2 V-26"],
  },
  4: {
    w: 36,
    c: "M-16,-3 Q-12,4 -5,0 L0,3 L5,0 Q12,4 16,-3 Q17,-20 13,-35 Q0,-40 -13,-35 Q-17,-20 -16,-3Z",
    r: "M-10,-35 C-10,-55 -7,-72 -3,-86 L0,-68 L3,-86 C7,-72 10,-55 10,-35Z",
    g: ["M-9,-3 Q0,-9 9,-3", "M0,-6 V-20"],
  },
  5: {
    w: 34,
    c: "M-15,-3 Q-11,4 -4,0 L0,3 L4,0 Q11,4 15,-3 Q16,-20 12,-35 Q0,-40 -12,-35 Q-16,-20 -15,-3Z",
    r: "M-9,-35 C-9,-58 -4,-80 0,-92 C4,-80 9,-58 9,-35Z",
    g: ["M-8,-3 Q0,-9 8,-3", "M0,-6 V-20"],
  },
  6: { w: 56, c: MOLAR, r: MOLAR_ROOT, g: MOLAR_GUM },
  7: { w: 52, c: MOLAR, r: MOLAR_ROOT, g: MOLAR_GUM },
  8: { w: 46, c: MOLAR, r: MOLAR_ROOT, g: MOLAR_GUM },
};

function has(keys: FindingKey[], id: FindingKey) {
  return keys.includes(id);
}

function colorOf(findings: Finding[], key: FindingKey, fallback: string) {
  return findings.find((f) => f.key === key)?.colorVar
    ? `var(${findings.find((f) => f.key === key)!.colorVar})`
    : fallback;
}

function toothXs(arr: number[]) {
  let x = 0;
  const centers: number[] = [];
  for (const n of arr) {
    const k = n % 10;
    const w = (SH[k].w * (k < 3 && n > 30 ? 0.8 : 1) + 6) * K;
    centers.push(x + w / 2);
    x += w;
  }
  const off = 480 - x / 2;
  return centers.map((v) => v + off);
}

function ToothMark({
  n,
  cx,
  upper,
  findings,
  selected,
  dimmed,
  onPick,
}: {
  n: number;
  cx: number;
  upper: boolean;
  findings: Finding[];
  selected: boolean;
  dimmed: boolean;
  onPick: () => void;
}) {
  const k = n % 10;
  const shape = SH[k];
  const u = (cx - 480) / 440;
  const lift = 30 * u * u;
  const yo = upper ? 196 - lift : 204 + lift;
  const rot = (upper ? -1 : 1) * u * 9;
  const lo = !upper && k < 3;
  const keys = findings.map((f) => f.key);
  const impact = has(keys, "impacted");
  const missing = has(keys, "missingTooth");
  const scale = `${lo ? K * 0.8 : K},${upper ? K : -K}`;
  const wrap = `translate(${cx},${yo}) rotate(${rot}) scale(${scale})${impact ? " rotate(26)" : ""}`;
  const yt = upper ? yo - 98 * K : yo + 98 * K;
  const ny = upper ? yt - 10 : yt + 22;
  const lead = findings[0];
  const impactC = colorOf(findings, "impacted", "#8b5cf6");
  const missC = colorOf(findings, "missingTooth", "#ec4899");
  const implantC = colorOf(findings, "implant", "#2f80ed");
  const boneC = colorOf(findings, "boneLoss", "#a78bfa");
  const rctC = colorOf(findings, "rootCanal", "#4f46e5");
  const periapC = colorOf(findings, "periapical", "#f97316");
  const crownC = colorOf(findings, "crown", "#0891b2");
  const fillC = colorOf(findings, "filling", "#16a34a");
  const cariesC = colorOf(findings, "caries", "#e5484d");

  return (
    <g
      className={cn("tooth", selected && "sel", findings.length === 0 && "h", dimmed && "dim")}
      onClick={onPick}
      role="button"
      tabIndex={0}
      aria-label={`Diş ${n}`}
    >
      <title>
        Diş {n}
        {lead ? ` · ${findings.map((f) => f.key).join(", ")}` : ""}
      </title>
      <rect
        className="halo"
        x={cx - (shape.w * K) / 2 - 6}
        y={upper ? yt - 34 : yo - 8}
        width={shape.w * K + 12}
        height={upper ? yo - yt + 40 : yt - yo + 42}
        rx="14"
      />
      <g className="tg" transform={wrap}>
        {missing ? (
          <>
            <path d={shape.c} fill={missC} fillOpacity={0.08} stroke={missC} strokeWidth="1.8" strokeDasharray="4 4" />
            <path d={shape.r} fill={missC} fillOpacity={0.08} stroke={missC} strokeWidth="1.8" strokeDasharray="4 4" />
            <path d="M-9,-54 L9,-34 M9,-54 L-9,-34" stroke={missC} strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            {has(keys, "implant") ? (
              <>
                <path d="M-8,-36 L8,-36 L6,-84 Q0,-90 -6,-84Z" fill="url(#ti)" stroke="#4d5966" strokeWidth=".9" />
                <path d="M-8,-44 H8 M-8,-52 H8 M-7,-60 H7 M-7,-68 H7 M-6,-76 H6" stroke="#4d5966" strokeWidth="1.6" opacity=".55" />
                <path d="M-6,-36 L6,-36 L5,-30 L-5,-30Z" fill="url(#ti)" stroke="#4d5966" strokeWidth=".8" />
              </>
            ) : (
              <>
                {k > 5 && upper ? <path d={PALATAL} fill="url(#rg)" stroke="#7f8f8c" strokeWidth="1.1" /> : null}
                <path className="rt" d={shape.r} fill="url(#rg)" stroke="#7f8f8c" strokeWidth="1.1" strokeLinejoin="round" />
                {impact ? <path d={shape.r} fill={impactC} fillOpacity={0.27} /> : null}
              </>
            )}
            {has(keys, "boneLoss") ? (
              <>
                <path d="M-26,-52 H26 V-34 H-26Z" fill={boneC} fillOpacity={0.33} />
                <path d="M-26,-52 H26" stroke={boneC} strokeWidth="2.6" strokeDasharray="5 3" />
              </>
            ) : null}
            {has(keys, "rootCanal") ? (
              <path
                d={k > 5 ? "M-12,-36 C-13,-52 -12,-66 -13,-76 M12,-36 C13,-52 12,-66 13,-76" : "M0,-34 L0,-84"}
                stroke={rctC}
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
            ) : null}
            {has(keys, "periapical") ? (
              <circle cx="0" cy={k > 5 ? -84 : k === 3 ? -102 : -90} r="10" fill={periapC} fillOpacity={0.27} stroke={periapC} strokeWidth="2" />
            ) : null}
            <path className="cr" d={shape.c} fill="url(#en)" stroke="#7f8f8c" strokeWidth="1.1" strokeLinejoin="round" />
            {impact ? (
              <path d={shape.c} fill={impactC} fillOpacity={0.27} stroke={impactC} strokeWidth="1.6" strokeDasharray="3 3" />
            ) : null}
            {has(keys, "implant") || has(keys, "crown") ? (
              <>
                <path d={shape.c} fill={has(keys, "implant") ? implantC : crownC} fillOpacity={0.22} stroke={has(keys, "implant") ? implantC : crownC} strokeWidth="2.2" />
                <path d="M-14,-33 H14" stroke={has(keys, "implant") ? implantC : crownC} strokeWidth="2.6" />
              </>
            ) : null}
            {has(keys, "filling") ? (
              <>
                <path d={shape.c} fill={fillC} fillOpacity={0.19} />
                <path d="M-10,-4 Q0,-1 10,-4 L9,-22 Q0,-25 -9,-22Z" fill={fillC} stroke="#0f6a30" strokeWidth="1" opacity=".92" />
              </>
            ) : null}
            {has(keys, "caries") || has(keys, "deepCaries") ? (
              <>
                <ellipse cx="-6" cy="-16" rx="5.5" ry="6.5" fill="#6b1d14" opacity=".85" />
                <circle cx="-6" cy="-16" r="10" fill="none" stroke={cariesC} strokeWidth="1.8" />
              </>
            ) : null}
          </>
        )}
      </g>
      <text x={cx} y={ny} textAnchor="middle">
        {n}
      </text>
      {findings.slice(0, 4).map((f, j) => (
        <circle
          key={f.id}
          cx={cx + (j - (Math.min(findings.length, 4) - 1) / 2) * 11}
          cy={upper ? ny - 23 : ny + 14}
          r="4.3"
          fill={`var(${f.colorVar})`}
          stroke="#fff"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

export function ClinicFdiChart({
  findings,
  lang,
  selectedTooth,
  onPick,
}: {
  findings: Finding[];
  lang: Lang;
  selectedTooth: number | null;
  onPick: (tooth: number) => void;
}) {
  const byTooth = new Map<number, Finding[]>();
  for (const f of findings) {
    const n = fdiOf(f);
    if (!n) continue;
    const list = byTooth.get(n) ?? [];
    list.push(f);
    byTooth.set(n, list);
  }
  const legend = [...new Map(findings.map((f) => [f.key, f])).values()];
  const upperXs = toothXs(UPPER);
  const lowerXs = toothXs(LOWER);

  return (
    <section className="clinic-chart">
      <h2>{t(lang, "clinic.chartTitle")}</h2>
      <p>{t(lang, "clinic.chartHint")}</p>
      {legend.length ? (
        <div className="lg">
          {legend.map((f) => (
            <button key={f.key} type="button" className={selectedTooth && byTooth.get(selectedTooth)?.some((x) => x.key === f.key) ? "on" : undefined}>
              <i className="d" style={{ background: `var(${f.colorVar})` }} />
              {findingLabel(lang, f.key)} <b>{[...byTooth.values()].filter((list) => list.some((x) => x.key === f.key)).length}</b>
            </button>
          ))}
        </div>
      ) : null}
      <svg className="t" viewBox="0 0 960 400" role="img" aria-label={t(lang, "clinic.chartTitle")}>
        <defs>
          <linearGradient id="en" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--tf)" />
            <stop offset="1" stopColor="var(--tf)" />
          </linearGradient>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--tr)" />
            <stop offset="1" stopColor="var(--tr)" />
          </linearGradient>
          <linearGradient id="ti" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8c9aa8" />
            <stop offset="1" stopColor="#8c9aa8" />
          </linearGradient>
        </defs>
        <line className="mid" x1="480" y1="34" x2="480" y2="366" />
        <text className="qn" x="24" y="24">
          {lang === "tr" ? "Sağ üst · 1" : "Upper right · 1"}
        </text>
        <text className="qn" x="936" y="24" textAnchor="end">
          {lang === "tr" ? "Sol üst · 2" : "Upper left · 2"}
        </text>
        <text className="qn" x="24" y="390">
          {lang === "tr" ? "Sağ alt · 4" : "Lower right · 4"}
        </text>
        <text className="qn" x="936" y="390" textAnchor="end">
          {lang === "tr" ? "Sol alt · 3" : "Lower left · 3"}
        </text>
        {UPPER.map((n, i) => (
          <ToothMark
            key={n}
            n={n}
            cx={upperXs[i]}
            upper
            findings={byTooth.get(n) ?? []}
            selected={selectedTooth === n}
            dimmed={selectedTooth !== null && selectedTooth !== n}
            onPick={() => onPick(n)}
          />
        ))}
        {LOWER.map((n, i) => (
          <ToothMark
            key={n}
            n={n}
            cx={lowerXs[i]}
            upper={false}
            findings={byTooth.get(n) ?? []}
            selected={selectedTooth === n}
            dimmed={selectedTooth !== null && selectedTooth !== n}
            onPick={() => onPick(n)}
          />
        ))}
      </svg>
    </section>
  );
}
