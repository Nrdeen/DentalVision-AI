import { quadrantOfFdi, type Quadrant } from "./fdi.ts";
import type { Finding, IntraoralToothScope } from "./types.ts";

export function applyIntraoralScope(findings: Finding[], scope: IntraoralToothScope): Finding[] {
  if (!scope) {
    return findings.map((f) => ({
      ...f,
      tooth: f.toothSource === "clinician" ? "-" : f.tooth,
      quadrant: f.toothSource === "clinician" ? undefined : f.quadrant,
      toothSource: f.toothSource === "clinician" ? undefined : f.toothSource,
    }));
  }
  if (scope.kind === "tooth") {
    const q = quadrantOfFdi(scope.fdi) ?? undefined;
    return findings.map((f) => ({
      ...f,
      tooth: scope.fdi,
      toothEst: undefined,
      toothSource: "clinician",
      quadrant: q,
    }));
  }
  return findings.map((f) => ({
    ...f,
    tooth: "-",
    toothEst: undefined,
    toothSource: "clinician",
    quadrant: scope.quadrant as Quadrant,
  }));
}
