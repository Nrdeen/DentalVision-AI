import assert from "node:assert/strict";
import { test } from "node:test";
import { contourFromLuminance, radialOutline } from "./tooth-contour.ts";

test("radial outline hugs a compact circular blob", () => {
  const w = 40;
  const h = 40;
  const mask = new Uint8Array(w * h);
  const cx = 20;
  const cy = 20;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= 12 ** 2) mask[y * w + x] = 1;
    }
  }
  const pts = radialOutline(mask, w, h);
  assert.ok(pts && pts.length > 16);
  const rs = pts.map(([x, y]) => Math.hypot(x * w - cx, y * h - cy));
  const avg = rs.reduce((a, b) => a + b, 0) / rs.length;
  assert.ok(avg > 9 && avg < 15);
});

test("luminance contour finds a bright ellipse on a dark field", () => {
  const w = 48;
  const h = 32;
  const lum = new Float32Array(w * h);
  lum.fill(40);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - 24) / 14;
      const ny = (y - 16) / 9;
      if (nx * nx + ny * ny <= 1) lum[y * w + x] = 200;
    }
  }
  const pts = contourFromLuminance(lum, w, h);
  assert.ok(pts && pts.length > 16);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  assert.ok(Math.min(...xs) > 0.1 && Math.max(...xs) < 0.9);
  assert.ok(Math.min(...ys) > 0.08 && Math.max(...ys) < 0.92);
});
