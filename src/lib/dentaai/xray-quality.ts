import type { I18nKey } from "./i18n";
import type { XrayQuality, XrayQualityFlag, XrayQualityLevel } from "./types";

const FLAG_KEYS: Record<XrayQualityFlag, I18nKey> = {
  small: "xray.flag.small",
  blur: "xray.flag.blur",
  dark: "xray.flag.dark",
  bright: "xray.flag.bright",
  compressed: "xray.flag.compressed",
  crop: "xray.flag.crop",
  inverted: "xray.flag.inverted",
  narrow: "xray.flag.narrow",
};

export function qualityTitleKey(level: XrayQualityLevel): I18nKey {
  if (level === "poor") return "xray.qualityPoor";
  if (level === "fair") return "xray.qualityFair";
  return "xray.qualityGood";
}

export function qualityBodyKey(level: XrayQualityLevel): I18nKey {
  if (level === "poor") return "xray.qualityBodyPoor";
  if (level === "fair") return "xray.qualityBodyFair";
  return "xray.qualityBodyGood";
}

export function flagKey(flag: string): I18nKey | null {
  return FLAG_KEYS[flag as XrayQualityFlag] ?? null;
}

export function shouldShowQualityBanner(quality: XrayQuality | null): boolean {
  if (!quality) return false;
  if (quality.level !== "good") return true;
  return quality.flags.some((f) => f === "inverted" || f === "crop");
}
