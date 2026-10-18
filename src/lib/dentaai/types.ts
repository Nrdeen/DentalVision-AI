export type Lang = "en" | "tr";
export type Severity = "high" | "medium" | "low";
export type Modality = "xray" | "intraoral";
export type ViewId = "overview" | "health" | "ai" | "bone";

export type MIOClass = "healthy" | "gingivitis" | "periodontitis";

export interface MIOClassification {
  class_name: MIOClass;
  confidence: number;
  probabilities: Record<MIOClass, number>;
}

export type FindingKey =
  | "caries"
  | "deepCaries"
  | "xrayKuretaj"
  | "periapical"
  | "impacted"
  | "earlyCaries"
  | "permanentCaries"
  | "primaryCaries"
  | "gingivitis"
  | "plaque"
  | "ulcer"
  | "fracture"
  | "rootCanal"
  | "periodontitis"
  | "healthy"
  | "abrasion"
  | "filling"
  | "crown"
  | "caries1"
  | "caries2"
  | "caries3"
  | "caries4"
  | "caries5"
  | "caries6"
  | "boneLoss"
  | "missingTooth"
  | "retainedRoot"
  | "implant"
  | "bridge";

/**
 * Shared detector result consumed by image overlays, finding cards and report fusion.
 * `key` is a locale-independent class ID; position and description fields are i18n keys.
 * `confidence` is in [0, 1], `severity` is lowercase, and `bbox` uses normalized image
 * coordinates in [0, 1], ordered as x1, y1, x2, y2.
 * `mask` is optional segmentation mask data (for segmentation models like AlphaDent).
 * Keep detector outputs on this shape; adapt external model responses at the boundary.
 */
export interface Finding {
  id: string;
  key: FindingKey;
  confidence: number;
  tooth: string;
  // FDI numbers estimated from arch geometry (not model output); see tooth-numbering.ts.
  toothEst?: string[];
  positionKey: string;
  severity: Severity;
  descriptionKey: string;
  bbox: [number, number, number, number];
  colorVar: string;
  mask?: number[][]; // Optional segmentation mask (normalized coordinates)
  source: "xray" | "intraoral"; // Track which modality this finding came from
  modelName?: "xray" | "annotated-intraoral-caries" | "alphadent" | "mio";
  modelClassId?: number;
  modelClassName?: string;
  specialistId?:
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
  displayPolicy?: "show" | "withhold" | "anatomy";
  withheldReason?: "low-confidence" | "anatomy" | "unreliable-class" | "below-user-threshold";
}

export interface ImageAdjust {
  brightness: number;
  contrast: number;
  invert: boolean;
  zoom: number;
  panX: number;
  panY: number;
  showOverlay: boolean;
  view: ViewId;
}

export interface FusionRow {
  problem: string;
  problemKey: string;
  xray: boolean;
  intraoral: boolean;
  resultKey: "strong" | "deep" | "surface";
  level: "shared" | "xray_only" | "intra_only";
}

/** Modality counts count boxes; sharedCount counts normalized classes present in both. */
export interface FusionResult {
  xrayCount: number;
  intraCount: number;
  sharedCount: number;
  rows: FusionRow[];
  overallKey: "moderate" | "mild" | "low";
  noteKey: "review" | "follow" | "routine";
  shared: string[];
  onlyX: string[];
  onlyI: string[];
}

export const DEFAULT_ADJUST: ImageAdjust = {
  brightness: 0,
  contrast: 1,
  invert: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  showOverlay: true,
  view: "overview",
};

export const SAMPLE_XRAY = "/samples/xray.jpg";
export const SAMPLE_INTRAORAL = "/samples/intraoral.jpg";
