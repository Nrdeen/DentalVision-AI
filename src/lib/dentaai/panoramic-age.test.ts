import assert from "node:assert/strict";
import { test } from "node:test";
import { adultPanoramicAllowed, panoramicCohort } from "./panoramic-age.ts";

test("adult panoramic module runs from age 16", () => {
  assert.equal(panoramicCohort(16), "adult");
  assert.equal(panoramicCohort(40), "adult");
  assert.equal(adultPanoramicAllowed(16), true);
});

test("adult panoramic detections stay hidden at 12 and under", () => {
  assert.equal(panoramicCohort(12), "child");
  assert.equal(panoramicCohort(4), "child");
  assert.equal(adultPanoramicAllowed(12), false);
});

test("ages 13 to 15 are outside this panoramic indication", () => {
  assert.equal(panoramicCohort(13), "adolescent");
  assert.equal(panoramicCohort(15), "adolescent");
  assert.equal(adultPanoramicAllowed(15), false);
});

test("missing age does not run a module", () => {
  assert.equal(panoramicCohort(null), "unset");
  assert.equal(adultPanoramicAllowed(undefined), false);
});
