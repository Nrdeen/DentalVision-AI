import assert from "node:assert/strict";
import { test } from "node:test";
import { applyIntraoralScope } from "./intraoral-scope.ts";
import type { Finding } from "./types.ts";

function finding(): Finding {
  return {
    id: "i1",
    key: "earlyCaries",
    confidence: 0.88,
    tooth: "-",
    positionKey: "upperRightRegion",
    severity: "medium",
    descriptionKey: "earlyCariesDesc",
    bbox: [0.2, 0.2, 0.4, 0.5],
    colorVar: "--color-finding-caries",
    source: "intraoral",
  };
}

test("tooth scope stamps a confirmed FDI number", () => {
  const [out] = applyIntraoralScope([finding()], { kind: "tooth", fdi: "26" });
  assert.equal(out?.tooth, "26");
  assert.equal(out?.quadrant, 2);
  assert.equal(out?.toothSource, "clinician");
});

test("quadrant scope does not invent a tooth number", () => {
  const [out] = applyIntraoralScope([finding()], { kind: "quadrant", quadrant: 3 });
  assert.equal(out?.tooth, "-");
  assert.equal(out?.quadrant, 3);
  assert.equal(out?.toothSource, "clinician");
});

test("clearing the scope removes a clinician stamp", () => {
  const stamped = applyIntraoralScope([finding()], { kind: "tooth", fdi: "16" });
  const [cleared] = applyIntraoralScope(stamped, null);
  assert.equal(cleared?.tooth, "-");
  assert.equal(cleared?.quadrant, undefined);
});
