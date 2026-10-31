import { parseFdiList, quadrantOfFdi, type Quadrant } from "./fdi.ts";
import type { Finding, FusionResult, FusionRow } from "./types.ts";

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
  rootCanal: "rootCanal",
  missingTooth: "missingTooth",
  implant: "implant",
  bridge: "bridge",
  crown: "crown",
  filling: "filling",
  boneLoss: "boneLoss",
  retainedRoot: "retainedRoot",
  fracture: "fracture",
};

const NON_PROBLEM_KEYS = new Set(["healthy"]);

function isProblemFinding(f: Finding): boolean {
  return !NON_PROBLEM_KEYS.has(f.key);
}

type Anchor =
  | { kind: "tooth"; fdi: string; estimated: boolean }
  | { kind: "quadrant"; quadrant: Quadrant }
  | { kind: "none" };

function anchorsOf(f: Finding): Anchor[] {
  const confirmed = parseFdiList(f.tooth);
  if (confirmed.length) {
    return confirmed.map((fdi) => ({
      kind: "tooth" as const,
      fdi,
      estimated: f.toothSource === "estimated",
    }));
  }
  if (f.toothEst?.length) {
    return f.toothEst.map((fdi) => ({ kind: "tooth" as const, fdi, estimated: true }));
  }
  if (f.quadrant === 1 || f.quadrant === 2 || f.quadrant === 3 || f.quadrant === 4) {
    return [{ kind: "quadrant", quadrant: f.quadrant }];
  }
  return [{ kind: "none" }];
}

function problemOf(f: Finding) {
  return normalizeLabel(f.key);
}

/**
 * Late-fusion rules (presence language, not a claim that fusion raises mAP).
 * Citations: docs/fusion-rules.md — pending clinical-reviewer sign-off.
 *
 * aligned          — same diagnosis + same confirmed FDI tooth (ISO 3950)
 * tentative        — same diagnosis + same FDI but the X-ray number is geometric ≈
 * quadrant_match   — same diagnosis + same quadrant only (photo has no tooth)
 * xray_only        — on the radiograph, not on the photo at that tooth (not “deep”)
 * intra_only       — on the photo, not on the radiograph (complementary, not a conflict)
 * unlinkable       — photo finding has no tooth and no quadrant; no fusion is shown
 */
export function fuseFindings(xray: Finding[], intraoral: Finding[]): FusionResult {
  const x = xray.filter(isProblemFinding);
  const i = intraoral.filter(isProblemFinding);

  const rows: FusionRow[] = [];
  const usedIntra = new Set<string>();

  for (const xf of x) {
    const xp = problemOf(xf);
    for (const xa of anchorsOf(xf)) {
      if (xa.kind === "none") {
        rows.push(row(xp, null, true, false, "xray_only"));
        continue;
      }
      const match = i.find((inf) => {
        if (usedIntra.has(inf.id)) return false;
        if (problemOf(inf) !== xp) return false;
        return anchorsCompatible(xa, anchorsOf(inf)[0]);
      });
      if (!match) {
        rows.push(row(xp, labelOf(xa), true, false, "xray_only"));
        continue;
      }
      usedIntra.add(match.id);
      const ia = anchorsOf(match)[0];
      rows.push(row(xp, labelOf(xa), true, true, resultOf(xa, ia)));
    }
  }

  for (const inf of i) {
    if (usedIntra.has(inf.id)) continue;
    const ip = problemOf(inf);
    const ia = anchorsOf(inf)[0];
    if (ia.kind === "none") {
      rows.push(row(ip, null, false, true, "unlinkable"));
      continue;
    }
    rows.push(row(ip, labelOf(ia), false, true, "intra_only"));
  }

  const aligned = rows.filter((r) => r.resultKey === "aligned").length;
  const sharedCount = aligned;
  const onlyX = [...new Set(rows.filter((r) => r.resultKey === "xray_only").map((r) => r.problem))];
  const onlyI = [...new Set(rows.filter((r) => r.resultKey === "intra_only").map((r) => r.problem))];
  const shared = [...new Set(rows.filter((r) => r.xray && r.intraoral && r.resultKey !== "unlinkable").map((r) => r.problem))];

  let overallKey: FusionResult["overallKey"] = "low";
  let noteKey: FusionResult["noteKey"] = "routine";
  if (aligned >= 1 || onlyX.length >= 2) {
    overallKey = "moderate";
    noteKey = "review";
  } else if (onlyX.length + onlyI.length >= 1 || sharedCount >= 1) {
    overallKey = "mild";
    noteKey = "follow";
  }

  return {
    xrayCount: x.length,
    intraCount: i.length,
    sharedCount,
    rows,
    overallKey,
    noteKey,
    shared,
    onlyX,
    onlyI,
  };
}

function anchorsCompatible(x: Anchor, i: Anchor) {
  if (i.kind === "none" || x.kind === "none") return false;
  if (x.kind === "tooth" && i.kind === "tooth") return x.fdi === i.fdi;
  if (x.kind === "tooth" && i.kind === "quadrant") return quadrantOfFdi(x.fdi) === i.quadrant;
  if (x.kind === "quadrant" && i.kind === "quadrant") return x.quadrant === i.quadrant;
  if (x.kind === "quadrant" && i.kind === "tooth") return x.quadrant === quadrantOfFdi(i.fdi);
  return false;
}

function resultOf(x: Anchor, i: Anchor): FusionRow["resultKey"] {
  if (x.kind === "tooth" && i.kind === "tooth" && x.fdi === i.fdi) {
    return x.estimated ? "tentative" : "aligned";
  }
  return "quadrant_match";
}

function labelOf(a: Anchor) {
  if (a.kind === "tooth") return a.estimated ? `≈${a.fdi}` : a.fdi;
  if (a.kind === "quadrant") return `Q${a.quadrant}`;
  return null;
}

function row(
  problem: string,
  tooth: string | null,
  xray: boolean,
  intraoral: boolean,
  resultKey: FusionRow["resultKey"],
): FusionRow {
  const level =
    resultKey === "aligned" || resultKey === "tentative" || resultKey === "quadrant_match"
      ? "shared"
      : resultKey === "xray_only"
        ? "xray_only"
        : resultKey === "unlinkable"
          ? "unlinkable"
          : "intra_only";
  return {
    problem,
    problemKey: PROBLEM_KEYS[problem] ?? problem,
    tooth,
    xray,
    intraoral,
    resultKey,
    level,
  };
}

export function getRecommendationKeys(fusion: FusionResult): string[] {
  const present = new Set([...fusion.shared, ...fusion.onlyX, ...fusion.onlyI]);
  const recs: string[] = [];
  if (present.has("caries")) recs.push("report.rec1");
  if (present.has("gingivitis") || present.has("periodontitis") || present.has("boneLoss")) recs.push("report.rec2");
  if (present.has("impacted")) recs.push("report.rec3");
  if (present.has("periapical")) recs.push("report.rec5");
  if (present.has("boneLoss")) recs.push("report.rec6");
  recs.push("report.rec4");
  return recs;
}
