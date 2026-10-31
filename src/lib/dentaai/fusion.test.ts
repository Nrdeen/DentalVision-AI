import assert from "node:assert/strict";
import { test } from "node:test";
import { fuseFindings } from "./fusion.ts";
import type { Finding } from "./types.ts";

function finding(patch: Partial<Finding> & Pick<Finding, "id" | "key" | "source">): Finding {
  return {
    confidence: 0.9,
    tooth: "-",
    positionKey: "upperRightRegion",
    severity: "high",
    descriptionKey: "cariesDesc",
    bbox: [0.2, 0.2, 0.3, 0.4],
    colorVar: "--color-finding-caries",
    ...patch,
  };
}

test("same diagnosis on different teeth is not aligned", () => {
  const fusion = fuseFindings(
    [finding({ id: "x", key: "caries", source: "xray", tooth: "16", toothSource: "model" })],
    [finding({ id: "i", key: "earlyCaries", source: "intraoral", tooth: "36", toothSource: "clinician" })],
  );
  assert.equal(fusion.rows.some((r) => r.resultKey === "aligned"), false);
  assert.ok(fusion.rows.some((r) => r.resultKey === "xray_only" && r.tooth === "16"));
  assert.ok(fusion.rows.some((r) => r.resultKey === "intra_only" && r.tooth === "36"));
});

test("same diagnosis and same confirmed tooth is aligned", () => {
  const fusion = fuseFindings(
    [finding({ id: "x", key: "caries", source: "xray", tooth: "16", toothSource: "model" })],
    [finding({ id: "i", key: "earlyCaries", source: "intraoral", tooth: "16", toothSource: "clinician" })],
  );
  assert.equal(fusion.rows[0]?.resultKey, "aligned");
  assert.equal(fusion.sharedCount, 1);
});

test("geometric X-ray tooth is tentative, not aligned", () => {
  const fusion = fuseFindings(
    [finding({ id: "x", key: "caries", source: "xray", toothEst: ["16"], toothSource: "estimated" })],
    [finding({ id: "i", key: "earlyCaries", source: "intraoral", tooth: "16", toothSource: "clinician" })],
  );
  assert.equal(fusion.rows[0]?.resultKey, "tentative");
  assert.equal(fusion.sharedCount, 0);
});

test("photo with only a quadrant matches at quadrant level, not aligned", () => {
  const fusion = fuseFindings(
    [finding({ id: "x", key: "caries", source: "xray", tooth: "16", toothSource: "model" })],
    [finding({ id: "i", key: "earlyCaries", source: "intraoral", quadrant: 1, toothSource: "clinician" })],
  );
  assert.equal(fusion.rows[0]?.resultKey, "quadrant_match");
  assert.equal(fusion.sharedCount, 0);
});

test("photo without tooth or quadrant is unlinkable", () => {
  const fusion = fuseFindings(
    [finding({ id: "x", key: "implant", source: "xray", tooth: "26", toothSource: "model" })],
    [finding({ id: "i", key: "plaque", source: "intraoral" })],
  );
  assert.ok(fusion.rows.some((r) => r.resultKey === "unlinkable"));
  assert.ok(fusion.rows.some((r) => r.resultKey === "xray_only"));
});

test("photo-only finding is complementary, not a conflict", () => {
  const fusion = fuseFindings(
    [],
    [finding({ id: "i", key: "earlyCaries", source: "intraoral", tooth: "11", toothSource: "clinician" })],
  );
  assert.equal(fusion.rows[0]?.resultKey, "intra_only");
});
