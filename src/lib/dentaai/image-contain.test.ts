import assert from "node:assert/strict";
import { test } from "node:test";
import { objectContainRect } from "./image-contain.ts";

test("wide stage letterboxes a panoramic on the left and right", () => {
  const r = objectContainRect(2000, 800, 2000, 1000);
  assert.equal(r.h, 800);
  assert.equal(r.w, 1600);
  assert.equal(r.x, 200);
  assert.equal(r.y, 0);
});

test("tall stage letterboxes a panoramic on the top and bottom", () => {
  const r = objectContainRect(800, 800, 1600, 800);
  assert.equal(r.w, 800);
  assert.equal(r.h, 400);
  assert.equal(r.x, 0);
  assert.equal(r.y, 200);
});
