import type { Finding, FusionResult, FusionRow } from "./types";

export function normalizeLabel(key: string, labelFallback = ""): string {
  const raw = `${key} ${labelFallback}`.toLowerCase();
  if (raw.includes("caries") || raw.includes("çürük") || raw.includes("curuk")) return "caries";
  if (raw.includes("gingivitis") || raw.includes("diş eti") || raw.includes("dis eti")) return "gingivitis";
  if (raw.includes("impacted") || raw.includes("gömülü") || raw.includes("gomulu")) return "impacted";
  if (raw.includes("periapical") || raw.includes("periapikal")) return "periapical";
  if (raw.includes("plaque") || raw.includes("plak")) return "plaque";
  if (raw.includes("ulcer") || raw.includes("ülser") || raw.includes("ulser")) return "ulcer";
  if (raw.includes("fracture") || raw.includes("kırık") || raw.includes("kirik")) return "fracture";
  if (raw.includes("kanal") || raw.includes("rootcanal") || raw.includes("root canal")) return "rootCanal";
  if (raw.includes("missing") || raw.includes("eksik")) return "missingTooth";
  if (raw.includes("implant")) return "implant";
  if (raw.includes("bridge") || raw.includes("köprü") || raw.includes("kopru")) return "bridge";
  if (raw.includes("crown") || raw.includes("kuron")) return "crown";
  if (raw.includes("filling") || raw.includes("dolgu")) return "filling";
  if (raw.includes("boneloss") || raw.includes("bone loss") || raw.includes("kemik")) return "boneLoss";
  if (raw.includes("retained") || raw.includes("kök parç")) return "retainedRoot";
  return key.toLowerCase();
}

const PROBLEM_KEYS: Record<string, string> = {
  caries: "cariesFamily",
  gingivitis: "gingivitis",
  impacted: "impacted",
  periapical: "periapical",
  plaque: "plaque",
  ulcer: "ulcer",
  fracture: "fracture",
  rootCanal: "rootCanal",
  missingTooth: "missingTooth",
  implant: "implant",
  bridge: "bridge",
  crown: "crown",
  filling: "filling",
  boneLoss: "boneLoss",
  retainedRoot: "retainedRoot",
};

// Findings that describe the absence of disease (not a problem) and must never be
// counted as a diagnosis in the fusion table, problem count or recommendations.
const NON_PROBLEM_KEYS = new Set(["healthy"]);

function isProblemFinding(f: Finding): boolean {
  return !NON_PROBLEM_KEYS.has(f.key);
}

export function fuseFindings(xray: Finding[], intraoral: Finding[]): FusionResult {
  const xLabels = new Set(xray.filter(isProblemFinding).map((f) => normalizeLabel(f.key)));
  const iLabels = new Set(intraoral.filter(isProblemFinding).map((f) => normalizeLabel(f.key)));
  const shared = [...xLabels].filter((l) => iLabels.has(l));
  const onlyX = [...xLabels].filter((l) => !iLabels.has(l));
  const onlyI = [...iLabels].filter((l) => !xLabels.has(l));

  const rows: FusionRow[] = [...new Set([...xLabels, ...iLabels])].sort().map((lab) => {
    const inX = xLabels.has(lab);
    const inI = iLabels.has(lab);
    const level = inX && inI ? "shared" : inX ? "xray_only" : "intra_only";
    const resultKey = level === "shared" ? "strong" : level === "xray_only" ? "deep" : "surface";
    return {
      problem: lab,
      problemKey: PROBLEM_KEYS[lab] ?? lab,
      xray: inX,
      intraoral: inI,
      resultKey,
      level,
    };
  });

  let overallKey: FusionResult["overallKey"] = "low";
  let noteKey: FusionResult["noteKey"] = "routine";
  if (shared.length >= 1 || onlyX.length >= 2) {
    overallKey = "moderate";
    noteKey = "review";
  } else if (onlyX.length + onlyI.length >= 1) {
    overallKey = "mild";
    noteKey = "follow";
  }

  return {
    xrayCount: xray.length,
    intraCount: intraoral.length,
    sharedCount: shared.length,
    rows,
    overallKey,
    noteKey,
    shared,
    onlyX,
    onlyI,
  };
}

/**
 * Pick recommendation keys based on which problem families are actually present
 * in the fused findings (excludes "healthy" and never names a condition that
 * wasn't detected). "report.rec4" (general hygiene) is always included since it
 * is generic advice, not a specific diagnosis claim.
 */
export function getRecommendationKeys(fusion: FusionResult): string[] {
  const present = new Set([...fusion.shared, ...fusion.onlyX, ...fusion.onlyI]);
  const recs: string[] = [];
  if (present.has("caries")) recs.push("report.rec1");
  if (present.has("gingivitis") || present.has("periodontitis")) recs.push("report.rec2");
  if (present.has("impacted")) recs.push("report.rec3");
  recs.push("report.rec4");
  return recs;
}
