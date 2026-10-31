import { quadrantOfFdi } from "./fdi.ts";
import { bestToothByIod, IOD_ASSIGN_FLOOR, type Box } from "./iod.ts";
import type { Finding } from "./types.ts";

export type NumberedTooth = { fdi: string; bbox: Box };

/**
 * Attach each disease finding to the FDI tooth with the highest IoD.
 * No-op when the 32-class tooth detector has not produced boxes.
 */
export function attachFindingsToTeeth(
  findings: Finding[],
  teeth: NumberedTooth[],
  minIod = IOD_ASSIGN_FLOOR,
): Finding[] {
  if (!teeth.length) return findings;
  return findings.map((f) => {
    const hit = bestToothByIod(f.bbox, teeth, minIod);
    if (!hit) return f;
    const quadrant = quadrantOfFdi(hit.fdi) ?? undefined;
    return {
      ...f,
      tooth: hit.fdi,
      toothEst: undefined,
      toothSource: "model" as const,
      quadrant,
    };
  });
}
