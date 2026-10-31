/**
 * Multi-model clinical ensemble for DentaAI.
 *
 * Thesis statement: a multi-model system for panoramic analysis, each model
 * specialised on a clear clinical task, with a confidence floor that withholds
 * weak diagnoses. The product has two imaging sections:
 *   1. Panoramic X-ray — deep / radiographic specialists
 *   2. Yüzeysel (intraoral) — surface disease on clinical photographs
 * Late fusion then combines both. Anatomy boxes (whole teeth, canal) are never
 * shown as diagnoses.
 */

import type { Finding, FindingKey, Severity } from "./types";

export type SectionId = "xray" | "intraoral" | "fusion";

export type SpecialistId =
  | "xray-impaction"
  | "xray-implant"
  | "xray-restorations"
  | "xray-periapical"
  | "xray-bone"
  | "xray-caries"
  | "xray-missing"
  | "intra-caries"
  | "intra-surface"
  | "intra-periodontal";

export type DisplayPolicy = "show" | "withhold" | "anatomy";

export type WithheldReason =
  | "low-confidence"
  | "anatomy"
  | "unreliable-class"
  | "below-user-threshold";

export interface SpecialistSpec {
  id: SpecialistId;
  section: Exclude<SectionId, "fusion">;
  /** Minimum detector confidence before a box may appear in the UI / report. */
  minConfidence: number;
  /** Empirical mAP50 from the last 60-class ToothTruth run; 0 if unused. */
  lastMap50: number | null;
  /** When false, detections stay hidden until a dedicated specialist is trained. */
  enabled: boolean;
  weightHint: string;
}

export const SPECIALISTS: Record<SpecialistId, SpecialistSpec> = {
  "xray-impaction": {
    id: "xray-impaction",
    section: "xray",
    minConfidence: 0.4,
    lastMap50: 0.955,
    enabled: true,
    weightHint: "models/xray/specialists/impaction.pt",
  },
  "xray-implant": {
    id: "xray-implant",
    section: "xray",
    minConfidence: 0.5,
    lastMap50: 0.99,
    enabled: true,
    weightHint: "models/xray/specialists/implant.pt",
  },
  "xray-restorations": {
    id: "xray-restorations",
    section: "xray",
    minConfidence: 0.5,
    lastMap50: 0.944,
    enabled: true,
    weightHint: "models/xray/specialists/restorations.pt",
  },
  "xray-missing": {
    id: "xray-missing",
    section: "xray",
    minConfidence: 0.5,
    lastMap50: 0.97,
    enabled: true,
    weightHint: "models/xray/specialists/missing.pt",
  },
  "xray-caries": {
    id: "xray-caries",
    section: "xray",
    minConfidence: 0.55,
    lastMap50: null,
    enabled: false,
    weightHint: "models/xray/specialists/caries.pt",
  },
  "xray-periapical": {
    id: "xray-periapical",
    section: "xray",
    minConfidence: 0.55,
    lastMap50: null,
    enabled: false,
    weightHint: "models/xray/specialists/periapical.pt",
  },
  "xray-bone": {
    id: "xray-bone",
    section: "xray",
    minConfidence: 0.55,
    lastMap50: 0.208,
    enabled: false,
    weightHint: "models/xray/specialists/bone.pt",
  },
  "intra-caries": {
    id: "intra-caries",
    section: "intraoral",
    minConfidence: 0.4,
    lastMap50: null,
    enabled: true,
    weightHint: "runs/detect/runs/intraoral/baseline-yolo11n-3/weights/best.pt",
  },
  "intra-surface": {
    id: "intra-surface",
    section: "intraoral",
    minConfidence: 0.45,
    lastMap50: 0.413,
    enabled: false,
    weightHint: "runs/segment/runs/segment/train-alphadent/weights/best.pt",
  },
  "intra-periodontal": {
    id: "intra-periodontal",
    section: "intraoral",
    minConfidence: 0.5,
    lastMap50: null,
    enabled: true,
    weightHint: "models/intraoral/mio_classification_best.pt",
  },
};

interface ClassRoute {
  key: FindingKey;
  descriptionKey: string;
  colorVar: string;
  specialist: SpecialistId;
  policy: DisplayPolicy;
}

const DENTEX_BY_ID: Record<number, ClassRoute> = {
  0: {
    key: "caries",
    descriptionKey: "cariesDesc",
    colorVar: "--color-finding-caries",
    specialist: "xray-caries",
    policy: "show",
  },
  1: {
    key: "xrayKuretaj",
    descriptionKey: "xrayKuretajDesc",
    colorVar: "--color-finding-deep",
    specialist: "xray-caries",
    policy: "show",
  },
  2: {
    key: "rootCanal",
    descriptionKey: "rootCanalDesc",
    colorVar: "--color-finding-kanal",
    specialist: "xray-restorations",
    policy: "show",
  },
  3: {
    key: "impacted",
    descriptionKey: "impactedDesc",
    colorVar: "--color-finding-impacted",
    specialist: "xray-impaction",
    policy: "show",
  },
  4: {
    key: "periapical",
    descriptionKey: "periapicalDesc",
    colorVar: "--color-finding-periapical",
    specialist: "xray-periapical",
    policy: "show",
  },
};

function route(
  key: FindingKey,
  descriptionKey: string,
  colorVar: string,
  specialist: SpecialistId,
  policy: DisplayPolicy = "show",
): ClassRoute {
  return { key, descriptionKey, colorVar, specialist, policy };
}

const ANATOMY = route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "anatomy");

/** Normalised alias → clinical route. Anatomy and rare labels never become diagnoses. */
const ALIASES: Array<[string, ClassRoute]> = [
  ["permanent teeth", { ...ANATOMY }],
  ["primary teeth", { ...ANATOMY }],
  ["mandibular canal", { ...ANATOMY }],
  ["maxillary sinus", { ...ANATOMY }],
  ["kuretaj", route("xrayKuretaj", "xrayKuretajDesc", "--color-finding-deep", "xray-caries")],
  ["impacted canine", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["impacted tooth", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["wisdom tooth", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["wisdom", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["mesioangular third molar impaction", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["gömülü", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["gomulu", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],
  ["impact", route("impacted", "impactedDesc", "--color-finding-impacted", "xray-impaction")],

  ["missing teeth", route("missingTooth", "missingToothDesc", "--color-finding-missing", "xray-missing")],
  ["missing tooth", route("missingTooth", "missingToothDesc", "--color-finding-missing", "xray-missing")],

  ["root canal obturation", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["root canal filling", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["root canal treatment", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["root canal", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["rct", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["kanal", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["post - core", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["post-core", route("rootCanal", "rootCanalDesc", "--color-finding-kanal", "xray-restorations")],
  ["ceramic bridge", route("bridge", "bridgeDesc", "--color-finding-bridge", "xray-restorations")],
  ["bridge", route("bridge", "bridgeDesc", "--color-finding-bridge", "xray-restorations")],
  ["porcelain crown", route("crown", "crownDesc", "--color-finding-crown", "xray-restorations")],
  ["implant", route("implant", "implantDesc", "--color-finding-implant", "xray-implant")],
  ["amalgam filling", route("filling", "fillingDesc", "--color-finding-filling", "xray-restorations")],
  ["dental filling", route("filling", "fillingDesc", "--color-finding-filling", "xray-restorations")],
  ["filling", route("filling", "fillingDesc", "--color-finding-filling", "xray-restorations")],
  ["metal bond", route("filling", "fillingDesc", "--color-finding-filling", "xray-restorations")],
  ["abutment", route("crown", "crownDesc", "--color-finding-crown", "xray-restorations")],
  ["crown", route("crown", "crownDesc", "--color-finding-crown", "xray-restorations")],

  ["retained root", route("retainedRoot", "retainedRootDesc", "--color-finding-kanal", "xray-restorations")],
  ["root piece", route("retainedRoot", "retainedRootDesc", "--color-finding-kanal", "xray-restorations")],

  ["apical periodontitis", route("periapical", "periapicalDesc", "--color-finding-periapical", "xray-periapical")],
  ["apical", route("periapical", "periapicalDesc", "--color-finding-periapical", "xray-periapical")],
  ["periapical lesion", route("periapical", "periapicalDesc", "--color-finding-periapical", "xray-periapical")],
  ["periapical", route("periapical", "periapicalDesc", "--color-finding-periapical", "xray-periapical")],
  ["periapikal", route("periapical", "periapicalDesc", "--color-finding-periapical", "xray-periapical")],
  ["lezyon", route("periapical", "periapicalDesc", "--color-finding-periapical", "xray-periapical")],

  ["bone loss", route("boneLoss", "boneLossDesc", "--color-finding-periapical", "xray-bone")],
  ["kemik", route("boneLoss", "boneLossDesc", "--color-finding-periapical", "xray-bone")],

  ["deep decay", route("deepCaries", "deepCariesDesc", "--color-finding-deep", "xray-caries")],
  ["deep caries", route("deepCaries", "deepCariesDesc", "--color-finding-deep", "xray-caries")],
  ["kretaj", route("xrayKuretaj", "xrayKuretajDesc", "--color-finding-deep", "xray-caries")],
  ["küretaj", route("xrayKuretaj", "xrayKuretajDesc", "--color-finding-deep", "xray-caries")],
  ["cavity", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries")],
  ["decay", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries")],
  ["caries", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries")],
  ["çürük", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries")],

  ["tad", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["wire", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["braces", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["orthodontic brackets", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["interdental wire", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["gingival former", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["spacing", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["attrition", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
  ["supra eruption", route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold")],
];

const INTRA_BY_KEY: Partial<Record<FindingKey, SpecialistId>> = {
  earlyCaries: "intra-caries",
  permanentCaries: "intra-caries",
  primaryCaries: "intra-caries",
  caries: "intra-caries",
  // AlphaDent subclasses — withheld with intra-surface (val mAP50 41.3%).
  caries1: "intra-surface",
  caries2: "intra-surface",
  caries3: "intra-surface",
  caries4: "intra-surface",
  caries5: "intra-surface",
  caries6: "intra-surface",
  plaque: "intra-surface",
  abrasion: "intra-surface",
  filling: "intra-surface",
  crown: "intra-surface",
  fracture: "intra-surface",
  ulcer: "intra-surface",
  gingivitis: "intra-periodontal",
  periodontitis: "intra-periodontal",
  healthy: "intra-periodontal",
};

function norm(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAlias(haystack: string, alias: string): boolean {
  if (haystack === alias) return true;
  if (alias.length <= 4) {
    return new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(haystack);
  }
  return haystack.includes(alias);
}

export function routeXrayClass(cls: number, name: string): ClassRoute {
  const n = norm(name);
  for (const [alias, mapped] of ALIASES) {
    if (matchesAlias(n, alias)) return mapped;
  }
  if (DENTEX_BY_ID[cls]) return DENTEX_BY_ID[cls];
  return route("caries", "cariesDesc", "--color-finding-caries", "xray-caries", "withhold");
}

export function specialistForFinding(finding: Finding): SpecialistId | null {
  if (finding.specialistId) return finding.specialistId;
  if (finding.source === "intraoral") return INTRA_BY_KEY[finding.key] ?? "intra-surface";
  return routeXrayClass(finding.modelClassId ?? -1, finding.modelClassName ?? finding.key).specialist;
}

function reasonFor(policy: DisplayPolicy, enabled: boolean, conf: number, floor: number): WithheldReason | null {
  if (policy === "anatomy") return "anatomy";
  if (policy === "withhold" || !enabled) return "unreliable-class";
  if (conf < floor) return "low-confidence";
  return null;
}

export function annotateFinding(finding: Finding): Finding {
  const source = finding.source;
  let policy: DisplayPolicy = "show";
  let specialist: SpecialistId;
  let descriptionKey = finding.descriptionKey;
  let colorVar = finding.colorVar;
  let key = finding.key;

  if (source === "xray") {
    const routed = routeXrayClass(finding.modelClassId ?? -1, finding.modelClassName ?? finding.key);
    policy = routed.policy;
    specialist = routed.specialist;
    key = routed.key;
    descriptionKey = routed.descriptionKey;
    colorVar = routed.colorVar;
  } else {
    specialist = INTRA_BY_KEY[finding.key] ?? "intra-surface";
    if (finding.key === "healthy") policy = "anatomy";
  }

  const spec = SPECIALISTS[specialist];
  if (!spec.enabled && policy === "show") policy = "withhold";

  return {
    ...finding,
    key,
    descriptionKey,
    colorVar,
    specialistId: specialist,
    displayPolicy: policy,
  };
}

export interface GateResult {
  visible: Finding[];
  withheld: Finding[];
}

/**
 * Keep only diagnoses that pass the specialist floor and the operator slider.
 * Anatomy and unreliable classes never appear on overlays, cards, or the PDF.
 */
export function gateFindings(findings: Finding[], userThreshold: number): GateResult {
  const visible: Finding[] = [];
  const withheld: Finding[] = [];

  for (const raw of findings) {
    const finding = annotateFinding(raw);
    const spec = finding.specialistId ? SPECIALISTS[finding.specialistId] : null;
    const floor = Math.max(userThreshold, spec?.minConfidence ?? userThreshold);
    const policy = finding.displayPolicy ?? "show";
    const why = reasonFor(policy, spec?.enabled ?? true, finding.confidence, floor);
    if (why) {
      withheld.push({ ...finding, withheldReason: why });
    } else {
      visible.push(finding);
    }
  }

  return { visible, withheld };
}

export function severityOf(conf: number): Severity {
  if (conf >= 0.75) return "high";
  if (conf >= 0.5) return "medium";
  return "low";
}
