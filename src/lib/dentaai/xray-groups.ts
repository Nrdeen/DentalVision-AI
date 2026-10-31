import type { SpecialistId } from "./ensemble";
import type { I18nKey } from "./i18n";
import type { Finding, FindingKey } from "./types";

export const XRAY_FINDING_GROUPS: {
  id: string;
  keys: FindingKey[];
  labelKey: I18nKey;
  colorVar: string;
  specialistId: SpecialistId;
}[] = [
  {
    id: "caries",
    keys: ["caries", "deepCaries", "xrayKuretaj"],
    labelKey: "findings.caries",
    colorVar: "--color-finding-caries",
    specialistId: "xray-caries",
  },
  {
    id: "periapical",
    keys: ["periapical"],
    labelKey: "findings.periapical",
    colorVar: "--color-finding-periapical",
    specialistId: "xray-periapical",
  },
  {
    id: "bone",
    keys: ["boneLoss"],
    labelKey: "findings.boneLoss",
    colorVar: "--color-finding-periapical",
    specialistId: "xray-bone",
  },
  { id: "impacted", keys: ["impacted"], labelKey: "findings.impacted", colorVar: "--color-finding-impacted", specialistId: "xray-impaction" },
  { id: "implant", keys: ["implant"], labelKey: "findings.implant", colorVar: "--color-finding-implant", specialistId: "xray-implant" },
  {
    id: "restorations",
    keys: ["filling", "crown", "bridge", "rootCanal"],
    labelKey: "xray.group.restorations",
    colorVar: "--color-finding-filling",
    specialistId: "xray-restorations",
  },
  { id: "missing", keys: ["missingTooth"], labelKey: "findings.missingTooth", colorVar: "--color-finding-missing", specialistId: "xray-missing" },
];

export function findingsInGroup(findings: Finding[], keys: FindingKey[]) {
  return findings.filter((f) => keys.includes(f.key));
}

export function groupConfidence(items: Finding[]) {
  if (items.length === 0) return 0;
  return items.reduce((sum, f) => sum + f.confidence, 0) / items.length;
}
