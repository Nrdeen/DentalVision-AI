/**
 * IoD as in DVCTNet (Luo et al., MICCAI 2025):
 * intersection(finding, tooth) / area(tooth box).
 * A small floor (default 0.05) is ours, so a stray box is not forced onto a distant tooth.
 */

export type Box = [number, number, number, number];

/** Below this IoD a finding is not attached to a tooth box. Not in DVCTNet; they use argmax only. */
export const IOD_ASSIGN_FLOOR = 0.05;

export function boxArea(box: Box) {
  const w = Math.max(0, box[2] - box[0]);
  const h = Math.max(0, box[3] - box[1]);
  return w * h;
}

export function intersectionArea(a: Box, b: Box) {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  return boxArea([x1, y1, x2, y2]);
}

export function iod(detection: Box, tooth: Box) {
  const toothArea = boxArea(tooth);
  if (toothArea <= 0) return 0;
  return intersectionArea(detection, tooth) / toothArea;
}

export function bestToothByIod(
  detection: Box,
  teeth: Array<{ fdi: string; bbox: Box }>,
  minIod = IOD_ASSIGN_FLOOR,
): { fdi: string; iod: number } | null {
  let best: { fdi: string; iod: number } | null = null;
  for (const tooth of teeth) {
    const score = iod(detection, tooth.bbox);
    if (score < minIod) continue;
    if (!best || score > best.iod) best = { fdi: tooth.fdi, iod: score };
  }
  return best;
}
