import type { I18nKey } from "./i18n";
import type { Finding, FindingKey } from "./types";

export const XRAY_FINDING_GROUPS: {
  id: string;
  keys: FindingKey[];
  labelKey: I18nKey;
  colorVar: string;
}[] = [
  { id: "impacted", keys: ["impacted"], labelKey: "findings.impacted", colorVar: "--color-finding-impacted" },
  { id: "implant", keys: ["implant"], labelKey: "findings.implant", colorVar: "--color-finding-implant" },
  { id: "restorations", keys: ["filling", "crown", "bridge", "rootCanal"], labelKey: "xray.group.restorations", colorVar: "--color-finding-filling" },
  { id: "missing", keys: ["missingTooth"], labelKey: "findings.missingTooth", colorVar: "--color-finding-impacted" },
];

export function findingsInGroup(findings: Finding[], keys: FindingKey[]) {
  return findings.filter((f) => keys.includes(f.key));
}

export function groupConfidence(items: Finding[]) {
  if (items.length === 0) return 0;
  return items.reduce((sum, f) => sum + f.confidence, 0) / items.length;
}
