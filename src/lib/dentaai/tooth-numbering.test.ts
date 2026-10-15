import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateFdiTeeth, estimateSingleFdiTooth, quadrantOfBox, toothDisplay, withEstimatedTeeth } from "./tooth-numbering.ts";

test("quadrants follow FDI orientation (image left = patient right)", () => {
  assert.equal(quadrantOfBox([0.2, 0.3, 0.3, 0.4]), 1);
  assert.equal(quadrantOfBox([0.7, 0.3, 0.8, 0.4]), 2);
  assert.equal(quadrantOfBox([0.7, 0.6, 0.8, 0.7]), 3);
  assert.equal(quadrantOfBox([0.2, 0.6, 0.3, 0.7]), 4);
});

test("teeth near the midline are incisors, far from it molars", () => {
  assert.deepEqual(estimateFdiTeeth([0.47, 0.3, 0.495, 0.4]).slice(0, 1), ["11"]);
  assert.deepEqual(estimateFdiTeeth([0.5, 0.6, 0.52, 0.7]), ["31"]);
  const molar = estimateFdiTeeth([0.2, 0.3, 0.26, 0.4]);
  assert.ok(molar.every((t) => t.startsWith("1") && Number(t[1]) >= 6), molar.join());
});

test("estimates stay valid FDI numbers and never exceed three teeth", () => {
  for (let x = 0; x < 0.95; x += 0.05) {
    for (const y of [0.3, 0.65]) {
      const teeth = estimateFdiTeeth([x, y, x + 0.4, y + 0.1]);
      assert.ok(teeth.length >= 1 && teeth.length <= 3);
      teeth.forEach((t) => assert.match(t, /^[1-4][1-8]$/));
    }
  }
});

test("estimates never overwrite a confirmed tooth number and are marked with ≈", () => {
  const base = { id: "a", bbox: [0.2, 0.3, 0.26, 0.4] } as never;
  const [confirmed] = withEstimatedTeeth([{ ...(base as object), tooth: "16" } as never]);
  assert.equal(toothDisplay(confirmed), "16");
  const [estimated] = withEstimatedTeeth([{ ...(base as object), tooth: "-" } as never]);
  assert.match(toothDisplay(estimated) ?? "", /^≈1[1-8]/);
});

test("keeps central intraoral detections on the central incisors", () => {
  assert.equal(estimateSingleFdiTooth([0.405, 0.17, 0.516, 0.41]), "11");
  assert.equal(estimateSingleFdiTooth([0.518, 0.17, 0.629, 0.41]), "21");
  assert.equal(estimateSingleFdiTooth([0.627, 0.179, 0.706, 0.395]), "23");
  assert.equal(estimateSingleFdiTooth([0.646, 0.574, 0.715, 0.804]), "34");
});
