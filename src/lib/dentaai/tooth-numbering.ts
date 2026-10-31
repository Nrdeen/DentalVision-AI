import type { Finding } from "./types";

// Fallback FDI estimate for panoramic radiographs when the 32-class tooth
// detector has not produced boxes. Geometry (midline / occlusal / average
// mesiodistal widths) is wrong when teeth are missing, crowded, or impacted.
// Always shown as "≈" and never counted as fusion "aligned".

type Box = [number, number, number, number];

const MIDLINE_X = 0.5;
const OCCLUSAL_Y = 0.48;
// Fraction of the image width that one half-arch (midline → third molar) spans.
const HALF_ARCH_SPAN = 0.31;
const MAX_TEETH = 3;

// Average mesiodistal widths (mm), tooth 1 (central incisor) → 8 (third molar).
const UPPER_MM = [8.5, 6.5, 7.5, 7, 6.5, 10, 9, 8.5];
const LOWER_MM = [5, 5.5, 7, 7, 7, 11, 10.5, 10];

function archIntervals(widthsMm: number[]): Array<[number, number]> {
  const total = widthsMm.reduce((a, b) => a + b, 0);
  const scale = HALF_ARCH_SPAN / total;
  let start = 0;
  return widthsMm.map((w) => {
    const interval: [number, number] = [start, start + w * scale];
    start = interval[1];
    return interval;
  });
}

const UPPER_ARCH = archIntervals(UPPER_MM);
const LOWER_ARCH = archIntervals(LOWER_MM);

export function quadrantOfBox(bbox: Box): 1 | 2 | 3 | 4 {
  const cx = (bbox[0] + bbox[2]) / 2;
  const cy = (bbox[1] + bbox[3]) / 2;
  const upper = cy < OCCLUSAL_Y;
  const patientRight = cx < MIDLINE_X;
  if (upper) return patientRight ? 1 : 2;
  return patientRight ? 4 : 3;
}

export function estimateFdiTeeth(bbox: Box): string[] {
  const quadrant = quadrantOfBox(bbox);
  const arch = quadrant <= 2 ? UPPER_ARCH : LOWER_ARCH;
  const [x1, , x2] = bbox;

  const left = x1 - MIDLINE_X;
  const right = x2 - MIDLINE_X;
  const straddles = left < 0 && right > 0;
  const dMin = straddles ? 0 : Math.min(Math.abs(left), Math.abs(right));
  const dMax = Math.max(Math.abs(left), Math.abs(right));

  const scored = arch
    .map(([a, b], i) => ({ tooth: i + 1, overlap: Math.min(dMax, b) - Math.max(dMin, a), width: b - a }))
    .filter((t) => t.overlap > 0);

  let picked = scored.filter((t) => t.overlap >= t.width * 0.5);
  if (picked.length === 0) {
    const center = (dMin + dMax) / 2;
    const nearest =
      arch.findIndex(([a, b]) => center >= a && center < b) + 1 || (center < 0 ? 1 : arch.length);
    picked = [{ tooth: nearest, overlap: 0, width: 0 }];
  }

  return picked
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, MAX_TEETH)
    .map((t) => t.tooth)
    .sort((a, b) => a - b)
    .map((t) => String(quadrant * 10 + t));
}

export function estimateSingleFdiTooth(bbox: Box): string {
  const quadrant = quadrantOfBox(bbox);
  const arch = quadrant <= 2 ? UPPER_ARCH : LOWER_ARCH;
  const [x1, , x2] = bbox;
  const left = x1 - MIDLINE_X;
  const right = x2 - MIDLINE_X;
  const center = (Math.abs(left) + Math.abs(right)) / 2;
  const frontalEdges = [0.08, 0.13, 0.18, 0.23, 0.28];
  const frontalTooth = frontalEdges.findIndex((edge) => center <= edge);
  if (frontalTooth >= 0) return `${quadrant}${frontalTooth + 1}`;
  const tooth = arch.reduce((best, interval, index) => {
    const intervalCenter = (interval[0] + interval[1]) / 2;
    const bestCenter = (arch[best][0] + arch[best][1]) / 2;
    return Math.abs(intervalCenter - center) < Math.abs(bestCenter - center) ? index : best;
  }, 0);
  return `${quadrant}${tooth + 1}`;
}

export function withSingleEstimatedTeeth(findings: Finding[]): Finding[] {
  return findings.map((f) => {
    if (f.tooth !== "-" || f.toothEst?.length) return f;
    return { ...f, toothEst: [estimateSingleFdiTooth(f.bbox)], toothSource: "estimated" as const };
  });
}

export function withEstimatedTeeth(findings: Finding[]): Finding[] {
  return findings.map((f) =>
    f.tooth !== "-" || f.toothEst?.length ? f : { ...f, toothEst: estimateFdiTeeth(f.bbox) },
  );
}

// Confirmed number if present, otherwise the estimate prefixed with "≈".
export function toothDisplay(f: Pick<Finding, "tooth" | "toothEst">): string | null {
  if (f.tooth !== "-") return f.tooth;
  return f.toothEst?.length ? `≈${f.toothEst.join(", ")}` : null;
}

export function fdiOf(f: Pick<Finding, "tooth" | "toothEst">): number | null {
  const match = toothDisplay(f)?.match(/\d{2}/);
  if (!match) return null;
  const n = Number(match[0]);
  return n >= 11 && n <= 48 ? n : null;
}

export function isToothEstimated(f: Pick<Finding, "tooth" | "toothEst">): boolean {
  return f.tooth === "-" && Boolean(f.toothEst?.length);
}
