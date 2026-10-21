import assert from "node:assert/strict";
import { test } from "node:test";
import { detectIntraoral, detectXray } from "./detectors.ts";
import { gateFindings, routeXrayClass } from "./ensemble.ts";

test("impaction and missing teeth stay visible; anatomy does not", () => {
  assert.equal(routeXrayClass(3, "Impacted tooth").key, "impacted");
  assert.equal(routeXrayClass(3, "Impacted tooth").policy, "show");
  assert.equal(routeXrayClass(-1, "Missing teeth").key, "missingTooth");
  assert.equal(routeXrayClass(-1, "Mandibular Canal").policy, "anatomy");
  assert.equal(routeXrayClass(-1, "Permanent Teeth").policy, "anatomy");
});

test("OralXrays-9 class names route without mixing filling and root canal", () => {
  assert.equal(routeXrayClass(-1, "Wisdom Tooth").key, "impacted");
  assert.equal(routeXrayClass(-1, "Implant").key, "implant");
  assert.equal(routeXrayClass(-1, "Implant").specialist, "xray-implant");
  assert.equal(routeXrayClass(-1, "Porcelain Crown").key, "crown");
  assert.equal(routeXrayClass(-1, "Ceramic Bridge").key, "bridge");
  assert.equal(routeXrayClass(-1, "Dental Filling").key, "filling");
  assert.equal(routeXrayClass(-1, "Root Canal Filling").key, "rootCanal");
  assert.equal(routeXrayClass(-1, "Missing Tooth").key, "missingTooth");
  assert.equal(routeXrayClass(-1, "Decay").key, "caries");
  assert.equal(routeXrayClass(-1, "Apical Periodontitis").policy, "withhold");
});

test("short alias kanal does not swallow mandibular canal", () => {
  assert.equal(routeXrayClass(-1, "Mandibular Canal").policy, "anatomy");
  assert.equal(routeXrayClass(2, "kanal tedavisi").key, "rootCanal");
});

test("ToothTruth periapical and bone loss are withheld until specialists exist", () => {
  assert.equal(routeXrayClass(-1, "Periapical lesion").policy, "withhold");
  assert.equal(routeXrayClass(4, "lezyon").policy, "withhold");
  assert.equal(routeXrayClass(-1, "Bone Loss").policy, "withhold");
});

test("camelCase finding keys from the UI still route", () => {
  assert.equal(routeXrayClass(-1, "deepCaries").key, "deepCaries");
  assert.equal(routeXrayClass(-1, "xrayKuretaj").key, "xrayKuretaj");
});

test("only impacted tooth from the panoramic set stays visible", () => {
  const { visible, withheld } = gateFindings(detectXray(), 0.4);
  assert.deepEqual(
    visible.map((f) => f.key),
    ["impacted"],
  );
  assert.ok(withheld.some((f) => f.key === "caries"));
  assert.ok(withheld.some((f) => f.key === "periapical"));
});

test("trained implant specialist is shown when confidence clears the floor", () => {
  const { visible, withheld } = gateFindings(
    [
      {
        id: "imp-1",
        key: "implant",
        confidence: 0.88,
        tooth: "-",
        positionKey: "upperRightRegion",
        severity: "high",
        descriptionKey: "implantDesc",
        bbox: [0.2, 0.3, 0.3, 0.45],
        colorVar: "--color-finding-implant",
        source: "xray",
        modelClassName: "implant",
      },
    ],
    0.4,
  );
  assert.deepEqual(
    visible.map((f) => f.key),
    ["implant"],
  );
  assert.equal(withheld.length, 0);
});

test("yüzeysel intraoral findings stay in section 2 after the gate", () => {
  const { visible } = gateFindings(detectIntraoral(), 0.4);
  assert.ok(visible.some((f) => f.key === "earlyCaries"));
  assert.ok(visible.some((f) => f.key === "plaque"));
  assert.ok(visible.some((f) => f.key === "gingivitis"));
  assert.equal(
    visible.every((f) => f.source === "intraoral"),
    true,
  );
});

test("a box below the specialist floor is withheld even if the slider is lower", () => {
  const { visible, withheld } = gateFindings(
    [
      {
        ...detectXray()[2],
        id: "low-impacted",
        key: "impacted",
        confidence: 0.3,
        modelClassName: "Impacted tooth",
      },
    ],
    0.25,
  );
  assert.equal(visible.length, 0);
  assert.equal(withheld[0]?.withheldReason, "low-confidence");
});
