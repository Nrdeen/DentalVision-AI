import assert from "node:assert/strict";
import { test } from "node:test";
import { flagKey, qualityTitleKey, shouldShowQualityBanner } from "./xray-quality.ts";

test("poor clinic films show a warning banner", () => {
  assert.equal(qualityTitleKey("poor"), "xray.qualityPoor");
  assert.equal(
    shouldShowQualityBanner({
      level: "poor",
      flags: ["small", "compressed"],
      width: 640,
      height: 280,
      prepared: true,
    }),
    true,
  );
});

test("clean films stay quiet unless the ingest inverted or cropped", () => {
  assert.equal(
    shouldShowQualityBanner({
      level: "good",
      flags: [],
      width: 2800,
      height: 1400,
      prepared: true,
    }),
    false,
  );
  assert.equal(
    shouldShowQualityBanner({
      level: "good",
      flags: ["inverted"],
      width: 2800,
      height: 1400,
      prepared: true,
      inverted: true,
    }),
    true,
  );
  assert.equal(flagKey("compressed"), "xray.flag.compressed");
});
