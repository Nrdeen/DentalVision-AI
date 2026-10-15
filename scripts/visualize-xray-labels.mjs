/**
 * Draw YOLO bounding boxes on X-ray images for visual verification.
 *
 * Reads  data/xray/labels/<split>/<name>.txt
 * Reads  data/xray/images/<split>/<name>.png
 * Writes data/xray/visuals/<split>/<name>.png  (image + coloured boxes + labels)
 *
 * PNG decoding/encoding is implemented on top of node:zlib so the script has
 * no third-party dependencies (no sharp, no canvas, no npm install needed).
 *
 * Usage:
 *   node scripts/visualize-xray-labels.mjs                 # first 5 of each split
 *   node scripts/visualize-xray-labels.mjs 12              # first 12 of train
 *   node scripts/visualize-xray-labels.mjs 12 val          # 12 images from val
 *   node scripts/visualize-xray-labels.mjs 20 all test_0 test_1 test_7
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data/xray");

// Bright, mutually distinguishable colours, one per class id.
const CLASS_COLORS = [
  [255, 60, 60], // 0 caries        - red
  [255, 150, 0], // 1 deep caries   - orange
  [0, 210, 255], // 2 root canal    - cyan
  [140, 90, 255], // 3 impacted      - violet
  [60, 255, 120], // 4 lesion        - green
];

/* ------------------------------------------------------------------ PNG ---- */

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Decode a PNG into { width, height, channels, data } (8-bit RGB/RGBA/gray). */
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_MAGIC)) throw new Error("not a PNG file");

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error("interlaced PNG is not supported");

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported color type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);

  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const rowStart = y * stride;
    const prevStart = rowStart - stride;
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rp++];
      const left = x >= channels ? out[rowStart + x - channels] : 0;
      const up = y > 0 ? out[prevStart + x] : 0;
      const upLeft = y > 0 && x >= channels ? out[prevStart + x - channels] : 0;
      let value;
      switch (filter) {
        case 0: value = rawByte; break;
        case 1: value = rawByte + left; break;
        case 2: value = rawByte + up; break;
        case 3: value = rawByte + ((left + up) >> 1); break;
        case 4: value = rawByte + paeth(left, up, upLeft); break;
        default: throw new Error(`bad filter ${filter}`);
      }
      out[rowStart + x] = value & 0xff;
    }
  }

  return { width, height, channels, data: out };
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** Encode an RGB buffer as a PNG. */
function encodePng(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // truecolor RGB
  return Buffer.concat([
    PNG_MAGIC,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- drawing ---- */

/** Convert any decoded image to a fresh RGB canvas. */
function toRgb(img) {
  const rgb = Buffer.alloc(img.width * img.height * 3);
  for (let i = 0, p = 0; i < img.width * img.height; i++, p += 3) {
    const s = i * img.channels;
    if (img.channels >= 3) {
      rgb[p] = img.data[s];
      rgb[p + 1] = img.data[s + 1];
      rgb[p + 2] = img.data[s + 2];
    } else {
      rgb[p] = rgb[p + 1] = rgb[p + 2] = img.data[s];
    }
  }
  return rgb;
}

function setPixel(rgb, width, x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= width) return;
  const p = (y * width + x) * 3;
  rgb[p] = r;
  rgb[p + 1] = g;
  rgb[p + 2] = b;
}

function drawRect(rgb, width, height, x0, y0, x1, y1, color, thickness) {
  for (let t = 0; t < thickness; t++) {
    for (let x = x0; x <= x1; x++) {
      setPixel(rgb, width, x, y0 + t, color);
      setPixel(rgb, width, x, y1 - t, color);
    }
    for (let y = y0; y <= y1; y++) {
      setPixel(rgb, width, x0 + t, y, color);
      setPixel(rgb, width, x1 - t, y, color);
    }
  }
}

/** Crosshair at the box centre: makes a flipped cx/cy immediately obvious. */
function drawCross(rgb, width, height, cx, cy, color, size) {
  for (let d = -size; d <= size; d++) {
    setPixel(rgb, width, cx + d, cy, color);
    setPixel(rgb, width, cx, cy + d, color);
  }
}

/** Small filled 5x7 bitmap font, enough for digits and class names. */
const GLYPHS = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "c": ["00000", "00000", "01110", "10000", "10000", "10001", "01110"],
  "a": ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  "r": ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  "e": ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  "i": ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  "s": ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  "t": ["01000", "01000", "11110", "01000", "01000", "01001", "00110"],
  "k": ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  "l": ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  "u": ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  "m": ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  "g": ["00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  "o": ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  "n": ["00000", "00000", "10110", "11001", "10001", "10001", "10001"],
  "p": ["00000", "11110", "10001", "10001", "11110", "10000", "10000"],
  "z": ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

const GLYPH_W = 5;
const GLYPH_H = 7;

function textWidth(text, scale, spacing = 1) {
  return text.length * (GLYPH_W + spacing) * scale - spacing * scale;
}

function drawText(rgb, width, height, text, x, y, color, scale = 3) {
  let cx = x;
  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (glyph[gy][gx] !== "1") continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            setPixel(rgb, width, cx + gx * scale + sx, y + gy * scale + sy, color);
          }
        }
      }
    }
    cx += (GLYPH_W + 1) * scale;
  }
  void height;
}

/** Text with a dark plate behind it so it stays readable over the X-ray. */
function drawLabel(rgb, width, height, text, x, y, color, scale = 3) {
  const w = textWidth(text, scale);
  drawRect(rgb, width, height, x - 2, y - 2, x + w + 2, y + GLYPH_H * scale + 2, [0, 0, 0], 1);
  drawText(rgb, width, height, text, x, y, color, scale);
}

/* ------------------------------------------------------------- pipeline ---- */

function readClasses() {
  const file = join(DATA_DIR, "classes.txt");
  if (!existsSync(file)) throw new Error(`missing ${file}`);
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, ...rest] = line.split(/\s+/);
      return { id: Number(id), name: rest.join(" ") };
    });
}

function classLabel(className) {
  // Strip the leading "N-" from names like "1-çürük" so ASCII glyphs suffice.
  return className.replace(/^\d+-/, "").toLowerCase();
}

const count = Number(process.argv[2] ?? 5);
const splitArg = process.argv[3] ?? "all";
const explicit = process.argv.slice(4).filter((a) => !a.startsWith("-"));
const splits = splitArg === "all" ? ["train", "val", "test"] : [splitArg];
const classes = readClasses();
const byId = new Map(classes.map((c) => [c.id, c]));

mkdirSync(join(DATA_DIR, "visuals"), { recursive: true });
let written = 0;

for (const split of splits) {
  const lblDir = join(DATA_DIR, "labels", split);
  const imgDir = join(DATA_DIR, "images", split);
  if (!existsSync(lblDir)) continue;

  let files = readdirSync(lblDir).filter((f) => f.endsWith(".txt")).sort();
  if (explicit.length) {
    files = files.filter((f) => explicit.includes(f.replace(/\.txt$/, ""))).map((f) => f.replace(/\.txt$/, ".txt"));
  }
  files = files.slice(0, count);

  for (const file of files) {
    const id = file.replace(/\.txt$/, "");
    const imgPath = join(imgDir, `${id}.png`);
    if (!existsSync(imgPath)) {
      console.log(`SKIP ${split}/${id}: image missing`);
      continue;
    }

    const img = decodePng(readFileSync(imgPath));
    const rgb = toRgb(img);
    const { width, height } = img;

    const lines = readFileSync(join(lblDir, file), "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    const scale = Math.max(2, Math.round(height / 400));

    for (const line of lines) {
      const [cidRaw, cxRaw, cyRaw, wRaw, hRaw] = line.trim().split(/\s+/);
      const cid = Number(cidRaw);
      const cx = Number(cxRaw) * width;
      const cy = Number(cyRaw) * height;
      const w = Number(wRaw) * width;
      const h = Number(hRaw) * height;
      const color = CLASS_COLORS[cid % CLASS_COLORS.length];
      const x0 = Math.round(cx - w / 2);
      const y0 = Math.round(cy - h / 2);
      const x1 = Math.round(cx + w / 2);
      const y1 = Math.round(cy + h / 2);

      drawRect(rgb, width, height, x0, y0, x1, y1, color, Math.max(2, scale));
      drawCross(rgb, width, height, Math.round(cx), Math.round(cy), color, Math.max(6, scale * 3));
      const meta = byId.get(cid);
      const text = meta ? `${cid}-${classLabel(meta.name)}` : String(cid);
      const ty = y0 - GLYPH_H * scale - 4 < 0 ? y1 + 4 : y0 - GLYPH_H * scale - 4;
      drawLabel(rgb, width, height, text, Math.max(0, x0), ty, color, scale);
    }

    // Legend: expected box count for this image, so a 0-box file is visible.
    drawLabel(
      rgb, width, height, `${id} ${lines.length} boxes`, 8, 8, [255, 255, 255], scale,
    );

    const outDir = join(DATA_DIR, "visuals", split);
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `${id}.png`);
    writeFileSync(outPath, encodePng(width, height, rgb));
    console.log(`${outPath}  (${width}x${height}, ${lines.length} boxes)`);
    written += 1;
  }
}

console.log(`\n${written} annotated image(s) written under data/xray/visuals/`);
if (written === 0) console.log("nothing matched - check the split and count arguments");
