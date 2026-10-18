import { toast } from "sonner";
import { create } from "zustand";
import { t } from "./i18n";
import { adultPanoramicAllowed, panoramicCohort } from "./panoramic-age";
import { withSingleEstimatedTeeth } from "./tooth-numbering";
import {
  DEFAULT_ADJUST,
  SAMPLE_INTRAORAL,
  SAMPLE_XRAY,
  type Finding,
  type ImageAdjust,
  type Lang,
  type MIOClassification,
} from "./types";

/**
 * Calculate IoU (Intersection over Union) between two bounding boxes.
 * Bounding boxes are normalized [x1, y1, x2, y2] in [0, 1] range.
 */
function calculateIoU(bbox1: [number, number, number, number], bbox2: [number, number, number, number]): number {
  const [x1_1, y1_1, x2_1, y2_1] = bbox1;
  const [x1_2, y1_2, x2_2, y2_2] = bbox2;

  // Calculate intersection
  const x1_i = Math.max(x1_1, x1_2);
  const y1_i = Math.max(y1_1, y1_2);
  const x2_i = Math.min(x2_1, x2_2);
  const y2_i = Math.min(y2_1, y2_2);

  const intersection_width = Math.max(0, x2_i - x1_i);
  const intersection_height = Math.max(0, y2_i - y1_i);
  const intersection_area = intersection_width * intersection_height;

  // Calculate union
  const width1 = x2_1 - x1_1;
  const height1 = y2_1 - y1_1;
  const area1 = width1 * height1;

  const width2 = x2_2 - x1_2;
  const height2 = y2_2 - y1_2;
  const area2 = width2 * height2;

  const union_area = area1 + area2 - intersection_area;

  if (union_area === 0) return 0;
  return intersection_area / union_area;
}

/**
 * Deduplicate findings using IoU-based approach.
 * Removes detections that overlap significantly (IoU > 0.5) with a higher-confidence detection.
 */
function deduplicateFindings(findings: Finding[], iouThreshold: number = 0.5): Finding[] {
  console.log(`[DEDUP] Input: ${findings.length} findings, IoU threshold: ${iouThreshold}`);
  
  // Print all input findings
  console.log(`[DEDUP] Input findings:`);
  findings.forEach((f, i) => {
    console.log(`  ${i+1}. ${f.id} | ${f.key} | ${f.confidence.toFixed(4)} | bbox: [${f.bbox.map(b => b.toFixed(4)).join(', ')}]`);
  });
  
  // Count by model type
  const alphadentCount = findings.filter(f => f.id.startsWith('alphadent-')).length;
  const cariesCount = findings.filter(f => f.id.startsWith('caries-')).length;
  const mioCount = findings.filter(f => f.id.startsWith('mio-')).length;
  console.log(`[DEDUP] Before dedup - AlphaDent: ${alphadentCount}, Caries: ${cariesCount}, MIO: ${mioCount}`);
  
  // Sort by confidence descending
  const sorted = [...findings].sort((a, b) => b.confidence - a.confidence);
  const deduplicated: Finding[] = [];

  for (const finding of sorted) {
    let isDuplicate = false;

    for (const existing of deduplicated) {
      // Only compare findings of the same class
      if (existing.key !== finding.key) continue;

      const iou = calculateIoU(existing.bbox, finding.bbox);
      if (iou > iouThreshold) {
        isDuplicate = true;
        console.log(`[DEDUP] Removed duplicate: ${finding.id} (IoU: ${iou.toFixed(4)}, class: ${finding.key}, conf: ${finding.confidence.toFixed(4)})`);
        console.log(`  Kept: ${existing.id} (conf: ${existing.confidence.toFixed(4)})`);
        break;
      }
    }

    if (!isDuplicate) {
      deduplicated.push(finding);
    }
  }
  
  const alphadentAfter = deduplicated.filter(f => f.id.startsWith('alphadent-')).length;
  const cariesAfter = deduplicated.filter(f => f.id.startsWith('caries-')).length;
  const mioAfter = deduplicated.filter(f => f.id.startsWith('mio-')).length;
  console.log(`[DEDUP] After dedup - AlphaDent: ${alphadentAfter}, Caries: ${cariesAfter}, MIO: ${mioAfter}, Total: ${deduplicated.length}`);
  
  // Print all output findings
  console.log(`[DEDUP] Output findings:`);
  deduplicated.forEach((f, i) => {
    console.log(`  ${i+1}. ${f.id} | ${f.key} | ${f.confidence.toFixed(4)} | bbox: [${f.bbox.map(b => b.toFixed(4)).join(', ')}]`);
  });

  return deduplicated;
}

type InferResponse = {
  ok: boolean;
  error?: string;
  findings?: Finding[];
  weights?: string | null;
  mio_classification?: MIOClassification;
};

async function requestXrayInference(image: string): Promise<Finding[]> {
  const res = await fetch("/api/xray-infer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const payload = (await res.json()) as InferResponse;
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error || `Inference failed (${res.status})`);
  }
  return payload.findings ?? [];
}

async function requestIntraoralInference(image: string): Promise<{ findings: Finding[]; mioClassification: MIOClassification | null }> {
  // The Python server expects base64; sample images are served as URLs.
  if (!image.startsWith("data:")) {
    const blob = await (await fetch(image)).blob();
    image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  const res = await fetch("/api/intraoral-infer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const payload = (await res.json()) as InferResponse;
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error || `Inference failed (${res.status})`);
  }
  return {
    findings: payload.findings ?? [],
    mioClassification: payload.mio_classification ?? null
  };
}

export interface AppState {
  language: Lang;
  patientAge: number | null;
  threshold: number;
  overlayDefault: boolean;
  xrayImage: string | null;
  intraoralImage: string | null;
  xrayFindings: Finding[];
  intraoralFindings: Finding[];
  mioClassification: MIOClassification | null;
  xrayAdjust: ImageAdjust;
  intraoralAdjust: ImageAdjust;
  analyzing: "xray" | "intraoral" | null;
  query: string;
  selectedFindingId: string | null;
  hiddenFindingIds: string[];
  setLanguage: (language: Lang) => void;
  setPatientAge: (patientAge: number | null) => void;
  setThreshold: (threshold: number) => void;
  setOverlayDefault: (value: boolean) => void;
  setQuery: (query: string) => void;
  setSelectedFindingId: (id: string | null) => void;
  toggleFindingHidden: (id: string) => void;
  setHiddenFindingIds: (ids: string[]) => void;
  setXrayAdjust: (patch: Partial<ImageAdjust>) => void;
  setIntraoralAdjust: (patch: Partial<ImageAdjust>) => void;
  resetXrayAdjust: () => void;
  resetIntraoralAdjust: () => void;
  loadDemo: () => void;
  clearCase: () => void;
  runXray: (image: string) => Promise<void>;
  runIntraoral: (image: string) => Promise<void>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let xrayJob = 0;
let intraJob = 0;

export const useApp = create<AppState>()((set, get) => ({
  language: "tr",
  patientAge: null,
  // Operator slider; each specialist also applies its own higher floor in gateFindings.
  threshold: 0.4,
  overlayDefault: true,
  xrayImage: SAMPLE_XRAY,
  intraoralImage: SAMPLE_INTRAORAL,
  xrayFindings: [],
  intraoralFindings: [],
  mioClassification: null,
  xrayAdjust: { ...DEFAULT_ADJUST },
  intraoralAdjust: { ...DEFAULT_ADJUST },
  analyzing: null,
  query: "",
  selectedFindingId: null,
  hiddenFindingIds: [],
  setLanguage: (language) => set({ language }),
  setPatientAge: (patientAge) =>
    set((s) => ({
      patientAge,
      ...(adultPanoramicAllowed(patientAge)
        ? {}
        : { xrayFindings: [], selectedFindingId: null, hiddenFindingIds: [] }),
    })),
  setThreshold: (threshold) => set({ threshold }),
  setOverlayDefault: (overlayDefault) =>
    set((s) => ({
      overlayDefault,
      xrayAdjust: { ...s.xrayAdjust, showOverlay: overlayDefault },
      intraoralAdjust: { ...s.intraoralAdjust, showOverlay: overlayDefault },
    })),
  setQuery: (query) => set({ query }),
  setSelectedFindingId: (selectedFindingId) => set({ selectedFindingId }),
  toggleFindingHidden: (id) =>
    set((s) => ({
      hiddenFindingIds: s.hiddenFindingIds.includes(id)
        ? s.hiddenFindingIds.filter((x) => x !== id)
        : [...s.hiddenFindingIds, id],
    })),
  setHiddenFindingIds: (hiddenFindingIds) => set({ hiddenFindingIds }),
  setXrayAdjust: (patch) => set((s) => ({ xrayAdjust: { ...s.xrayAdjust, ...patch } })),
  setIntraoralAdjust: (patch) => set((s) => ({ intraoralAdjust: { ...s.intraoralAdjust, ...patch } })),
  resetXrayAdjust: () => set({ xrayAdjust: { ...DEFAULT_ADJUST } }),
  resetIntraoralAdjust: () => set({ intraoralAdjust: { ...DEFAULT_ADJUST } }),
  loadDemo: () => {
    set({ intraoralAdjust: { ...DEFAULT_ADJUST }, patientAge: 35 });
    void get().runXray(SAMPLE_XRAY);
    void get().runIntraoral(SAMPLE_INTRAORAL);
  },
  clearCase: () =>
    set({
      patientAge: null,
      xrayImage: null,
      intraoralImage: null,
      xrayFindings: [],
      intraoralFindings: [],
      selectedFindingId: null,
      hiddenFindingIds: [],
    }),
  runXray: async (image) => {
    const cohort = panoramicCohort(get().patientAge);
    if (cohort !== "adult") {
      const key =
        cohort === "child" ? "xray.childHeld" : cohort === "adolescent" ? "xray.gapHeld" : "xray.ageRequired";
      set({
        analyzing: null,
        xrayImage: image,
        xrayFindings: [],
        selectedFindingId: null,
        hiddenFindingIds: [],
      });
      toast.message(t(get().language, key));
      return;
    }
    const job = ++xrayJob;
    set({
      analyzing: "xray",
      xrayImage: image,
      xrayFindings: [],
      selectedFindingId: null,
      hiddenFindingIds: [],
      xrayAdjust: { ...DEFAULT_ADJUST },
    });
    try {
      const findings = await requestXrayInference(image);
      if (job !== xrayJob) return;
      // API now provides source field, no need to add it here
      // Apply IoU dedup to remove overlapping detections of the same class.
      const deduplicated = withSingleEstimatedTeeth(deduplicateFindings(findings));
      set({ analyzing: null, xrayFindings: deduplicated });
      if (deduplicated.length === 0) {
        toast.message("No detections above the model threshold for this image.");
      }
    } catch (err) {
      if (job !== xrayJob) return;
      const message = err instanceof Error ? err.message : String(err);
      set({ analyzing: null, xrayFindings: [] });
      toast.error(message);
    }
  },
  runIntraoral: async (image) => {
    const job = ++intraJob;
    set({
      analyzing: "intraoral",
      intraoralImage: image,
      intraoralFindings: [],
      mioClassification: null,
      selectedFindingId: null,
      hiddenFindingIds: [],
    });
    try {
      const { findings, mioClassification } = await requestIntraoralInference(image);
      if (job !== intraJob) return;
      // API now provides source field, no need to add it here
      // Apply deduplication to remove overlapping detections
      console.log(`[STORE] API returned ${findings.length} findings`);
      const deduplicated = withSingleEstimatedTeeth(deduplicateFindings(findings));
      console.log(`[STORE] Setting state with ${deduplicated.length} findings`);
      set({ analyzing: null, intraoralFindings: deduplicated, mioClassification });
      if (deduplicated.length === 0) {
        toast.message("No detections above the model threshold for this image.");
      }
    } catch (err) {
      if (job !== intraJob) return;
      const message = err instanceof Error ? err.message : String(err);
      set({ analyzing: null, intraoralFindings: [], mioClassification: null });
      toast.error(message);
    }
  },
}));
