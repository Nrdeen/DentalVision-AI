/** Trace a radiopaque blob inside a detection box so the overlay follows the tooth. */

export type Box = [number, number, number, number];
export type Point = [number, number];

const RAYS = 48;
const MAX_PATCH = 56;

function luminanceAt(data: Uint8ClampedArray, i: number) {
  const o = i * 4;
  return 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
}

function mean(values: Float32Array) {
  let s = 0;
  for (const v of values) s += v;
  return s / Math.max(1, values.length);
}

function floodLargest(mask: Uint8Array, w: number, h: number): Uint8Array {
  const seen = new Uint8Array(mask.length);
  let best: number[] = [];
  const qx = new Int32Array(mask.length);
  const qy = new Int32Array(mask.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!mask[start] || seen[start]) continue;
      let n = 0;
      let qs = 0;
      let qe = 0;
      qx[qe] = x;
      qy[qe] = y;
      qe++;
      seen[start] = 1;
      const cells: number[] = [];
      while (qs < qe) {
        const cx = qx[qs];
        const cy = qy[qs];
        qs++;
        const idx = cy * w + cx;
        cells.push(idx);
        n++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const ni = ny * w + nx;
            if (!mask[ni] || seen[ni]) continue;
            seen[ni] = 1;
            qx[qe] = nx;
            qy[qe] = ny;
            qe++;
          }
        }
      }
      if (n > best.length) best = cells;
    }
  }

  const out = new Uint8Array(mask.length);
  for (const i of best) out[i] = 1;
  return out;
}

function chaikin(points: Point[], rounds = 2): Point[] {
  let pts = points;
  for (let r = 0; r < rounds; r++) {
    const next: Point[] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % n];
      next.push([0.75 * x1 + 0.25 * x2, 0.75 * y1 + 0.25 * y2]);
      next.push([0.25 * x1 + 0.75 * x2, 0.25 * y1 + 0.75 * y2]);
    }
    pts = next;
  }
  return pts;
}

function erode(mask: Uint8Array, w: number, h: number) {
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (
        mask[i] &&
        mask[i - 1] &&
        mask[i + 1] &&
        mask[i - w] &&
        mask[i + w]
      ) {
        out[i] = 1;
      }
    }
  }
  return out;
}

export function radialOutline(mask: Uint8Array, w: number, h: number): Point[] | null {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const maxR = Math.hypot(cx, cy);
  const pts: Point[] = [];
  let hits = 0;

  for (let i = 0; i < RAYS; i++) {
    const a = (i / RAYS) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let rHit = 0;
    for (let r = maxR; r >= 0; r -= 0.6) {
      const x = Math.round(cx + dx * r);
      const y = Math.round(cy + dy * r);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if (mask[y * w + x]) {
        rHit = r;
        hits++;
        break;
      }
    }
    pts.push([(cx + dx * rHit) / w, (cy + dy * rHit) / h]);
  }

  if (hits < RAYS * 0.45) return null;
  return chaikin(pts, 2);
}

function blobScore(blob: Uint8Array, w: number, h: number) {
  const area = w * h;
  let n = 0;
  let sx = 0;
  let sy = 0;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!blob[y * w + x]) continue;
      n++;
      sx += x;
      sy += y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (n < area * 0.08 || n > area * 0.7) return { n, score: -1 };
  const fill = n / Math.max(1, (maxX - minX + 1) * (maxY - minY + 1));
  const cx = sx / n / Math.max(1, w - 1);
  const cy = sy / n / Math.max(1, h - 1);
  const center = 1 - Math.min(1, Math.hypot(cx - 0.5, cy - 0.5) * 2);
  return { n, score: fill * 2 + center + (1 - n / area) };
}

export function contourFromLuminance(lum: Float32Array, w: number, h: number): Point[] | null {
  if (w < 6 || h < 6) return null;
  const avg = mean(lum);
  const bright = new Uint8Array(lum.length);
  const dark = new Uint8Array(lum.length);
  for (let i = 0; i < lum.length; i++) {
    if (lum[i] > avg + 8) bright[i] = 1;
    if (lum[i] < avg - 8) dark[i] = 1;
  }
  const brightBlob = floodLargest(bright, w, h);
  const darkBlob = floodLargest(dark, w, h);
  const brightScore = blobScore(brightBlob, w, h);
  const darkScore = blobScore(darkBlob, w, h);
  const blob =
    brightScore.score < 0 && darkScore.score < 0
      ? null
      : brightScore.score >= darkScore.score
        ? brightBlob
        : darkBlob;
  if (!blob) return null;
  const tight = erode(blob, w, h);
  let kept = 0;
  for (const v of tight) kept += v;
  return radialOutline(kept > 12 ? tight : blob, w, h);
}

export function contourInImage(img: HTMLImageElement, bbox: Box): Point[] | null {
  const [x1, y1, x2, y2] = bbox;
  const sx = Math.max(0, Math.floor(x1 * img.naturalWidth));
  const sy = Math.max(0, Math.floor(y1 * img.naturalHeight));
  const sw = Math.max(4, Math.ceil((x2 - x1) * img.naturalWidth));
  const sh = Math.max(4, Math.ceil((y2 - y1) * img.naturalHeight));
  if (!sw || !sh) return null;

  const scale = Math.min(1, MAX_PATCH / Math.max(sw, sh));
  const w = Math.max(8, Math.round(sw * scale));
  const h = Math.max(8, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  } catch {
    return null;
  }
  const data = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < lum.length; i++) lum[i] = luminanceAt(data, i);
  const local = contourFromLuminance(lum, w, h);
  if (!local) return null;
  return local.map(([px, py]) => [x1 + px * (x2 - x1), y1 + py * (y2 - y1)]);
}
