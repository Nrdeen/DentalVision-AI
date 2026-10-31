import assert from "node:assert/strict";
import { test } from "node:test";
import { bestToothByIod, iod } from "./iod.ts";
import { attachFindingsToTeeth } from "./tooth-assign.ts";
import type { Finding } from "./types.ts";

test("IoD is intersection over the tooth box (DVCTNet)", () => {
  const detection: [number, number, number, number] = [0, 0, 1, 1];
  const tooth: [number, number, number, number] = [0, 0, 0.5, 1];
  assert.equal(iod(detection, tooth), 1);
});

test("a finding is assigned to the tooth with the highest IoD above the floor", () => {
  const hit = bestToothByIod(
    [0.4, 0.2, 0.55, 0.4],
    [
      { fdi: "15", bbox: [0.1, 0.2, 0.2, 0.4] },
      { fdi: "16", bbox: [0.38, 0.18, 0.58, 0.42] },
    ],
  );
  assert.equal(hit?.fdi, "16");
});

test("a finding is numbered from the tooth box, not from arch geometry", () => {
  const finding: Finding = {
    id: "x1",
    key: "caries",
    confidence: 0.9,
    tooth: "-",
    positionKey: "upperRightRegion",
    severity: "high",
    descriptionKey: "cariesDesc",
    bbox: [0.4, 0.2, 0.55, 0.4],
    colorVar: "--color-finding-caries",
    source: "xray",
  };
  const [numbered] = attachFindingsToTeeth([finding], [
    { fdi: "15", bbox: [0.1, 0.2, 0.2, 0.4] },
    { fdi: "16", bbox: [0.38, 0.18, 0.58, 0.42] },
  ]);
  assert.equal(numbered?.tooth, "16");
  assert.equal(numbered?.toothSource, "model");
  assert.equal(numbered?.quadrant, 1);
});

test("without tooth boxes the finding is left unnumbered", () => {
  const finding: Finding = {
    id: "x1",
    key: "implant",
    confidence: 0.9,
    tooth: "-",
    positionKey: "upperLeftRegion",
    severity: "medium",
    descriptionKey: "implantDesc",
    bbox: [0.6, 0.2, 0.7, 0.35],
    colorVar: "--color-finding-implant",
    source: "xray",
  };
  const [out] = attachFindingsToTeeth([finding], []);
  assert.equal(out?.tooth, "-");
  assert.equal(out?.toothSource, undefined);
});
