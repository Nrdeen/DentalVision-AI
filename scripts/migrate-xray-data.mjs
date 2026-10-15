/**
 * Migrate X-ray data from raw LabelMe format to YOLO-ready structure.
 *
 * Source:  data/xray/raw/disease/input/*.png  (images)
 *          data/xray/raw/disease/label/*.json (LabelMe annotations)
 *
 * Destination:
 *   data/xray/images/{train,val,test}/<basename>.png
 *   data/xray/labels/{split}/<basename>.txt    (YOLO detection format)
 *
 * Also writes data/xray/classes.txt with the class id → name mapping.
 *
 * ---------------------------------------------------------------------------
 * Why this script is defensive
 * ---------------------------------------------------------------------------
 * The raw DENTEX annotations spell class prefixes in several ways and they do
 * NOT all agree with classes.txt. Confirmed by running this script:
 *
 *   classes.txt : 2-kretaj     (no umlaut)
 *   raw JSON    : 2-küretaj    (WITH umlaut - this is the real spelling)
 *
 * A naive exact match silently discarded every deep-caries box, so class 1 was
 * trained from almost nothing. Name matching is therefore done on a normalized
 * key, so all of these hit class 1: "2-kretaj", "2-kuretaj", "2-küretaj",
 * "2-Küretaj".
 *
 * normalizeKey() must handle three families of Turkish characters:
 *   - "ü ö ç ğ ş"  decompose under NFD, so the combining marks strip cleanly
 *   - "ı" (dotless i) does NOT decompose, so it is mapped explicitly
 *   - "İ" uppercases to a combining sequence and is handled the same way
 * Without the explicit dotless-i step, "kırık" normalized to "krk" and the
 * fracture labels were reported as unknown spellings.
 *
 * ---------------------------------------------------------------------------
 * Two things that must NOT be auto-mapped onto a disease class
 * ---------------------------------------------------------------------------
 * DENTEX's numeric prefix is the folder index, not always one of our classes:
 *
 *   "0-saglam-11" = a HEALTHY tooth. Its prefix is 0, which is our class id 0
 *                   (caries). Mapping it there would teach the model that
 *                   healthy teeth are cavities -- far worse than dropping it.
 *   "5-çekim-16"  = extraction, and "8-kırık-42" = fracture. Not among our 5
 *                   target classes at all.
 *
 * So the numeric-prefix fallback is blocked for the non-disease vocabulary
 * below. Anything unmatched is reported with a count rather than discarded
 * silently, and the per-class histogram flags any class left at 0.
 *
 * Usage: node scripts/migrate-xray-data.mjs [--out data/xray] [--seed 42]
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const OUT_DIR = join(ROOT, arg("out", "data/xray"));
const RAW_INPUT = join(ROOT, arg("input", "data/xray/raw/disease/input"));
const RAW_LABEL = join(ROOT, arg("labels", "data/xray/raw/disease/label"));
const OUT_IMAGES = join(OUT_DIR, "images");
const OUT_LABELS = join(OUT_DIR, "labels");
const CLASSES_FILE = join(OUT_DIR, "classes.txt");

/**
 * Canonical class order taken from DENTEX (ids must never change).
 * [id, canonical name, list of accepted raw spellings]
 *
 * Umlauted and un-umlauted variants are both listed for readability;
 * normalizeKey() makes them equivalent regardless.
 */
const CLASS_DEFS = [
  [0, "1-çürük", ["1-çürük", "1-curuk", "1-caries", "1-dis"]],
  // The raw local label is "2-küretaj". Its clinical meaning is intentionally
  // not asserted as Deep Caries because the official DENTEX diagnosis schema
  // does not document küretaj as a class.
  [1, "2-kretaj", ["2-kretaj", "2-küretaj", "2-kuretaj"]],
  [2, "3-kanal", ["3-kanal", "3-kanal-tedavisi", "3-root-canal"]],
  [3, "6-gömülü", ["6-gömülü", "6-gomulu", "6-impacted", "6-gomulu-dis"]],
  [4, "7-lezyon", ["7-lezyon", "7-lesion", "7-lezyon-ucu"]],
];

/**
 * Normalize for tolerant comparison: lowercase, fold Turkish diacritics and
 * the dotless "ı", drop all punctuation and whitespace.
 */
function normalizeKey(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // combining marks from ü ö ç ğ ş İ
    .replace(/\u0131/g, "i") // dotless ı, which NFD leaves intact
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Normalized vocabulary present in the raw data that is NOT one of our five
 * disease classes. Checked before the numeric-prefix fallback so a healthy
 * tooth can never be relabelled as caries.
 */
const NON_DISEASE_KEYS = new Set(
  [
    "saglam",
    "saglam-dis",
    "cekim",
    "kirik",
    "kurk",
    "implant",
    "doldurma",
    "tartik",
    "kapaк",
  ].map((s) => normalizeKey(s)),
);

/** True when the label names a healthy tooth or a non-disease finding. */
function isNonDisease(raw) {
  const tokens = String(raw).split("-");
  if (tokens.some((tok) => NON_DISEASE_KEYS.has(normalizeKey(tok)))) return true;
  const head = normalizeKey(tokens.slice(0, 2).join("-"));
  return NON_DISEASE_KEYS.has(head);
}

const CLASS_BY_KEY = new Map();
for (const [id, canonical, aliases] of CLASS_DEFS) {
  for (const alias of [canonical, ...aliases]) {
    const key = normalizeKey(alias);
    if (CLASS_BY_KEY.has(key) && CLASS_BY_KEY.get(key) !== id) {
      throw new Error(
        `alias collision: "${alias}" maps to class ${CLASS_BY_KEY.get(key)} and ${id}`,
      );
    }
    CLASS_BY_KEY.set(key, id);
  }
}

/**
 * Raw labels look like "2-küretaj-41": the class prefix comes first and the
 * trailing "-<number>" is the FDI tooth number. Return { id, how } so the
 * caller can report which strategy resolved each label.
 *
 * Strategy: exact name match only (with Turkish normalization). No numeric
 * prefix fallback - unknown labels are reported for review instead of being
 * silently misclassified.
 */
function classIdForLabel(label) {
  const raw = String(label);

  // Strategy 1: longest known class prefix, ignoring the trailing tooth number.
  const tokens = raw.split("-");
  for (let take = Math.min(3, tokens.length); take >= 1; take--) {
    const candidate = tokens.slice(0, take).join("-");
    const id = CLASS_BY_KEY.get(normalizeKey(candidate));
    if (id !== undefined) return { id, how: "name" };
  }

  // Never map a healthy tooth or a non-disease finding onto a disease class.
  if (isNonDisease(raw)) return { id: -1, how: "non-disease" };

  // REMOVED: numeric-prefix fallback was dangerous. An unknown label like "1-unknown-thing"
  // would map to class 1 (deep caries) when it should be flagged for review. Better to
  // skip and report than to silently misclassify.
  return { id: -1, how: "unresolved" };
}

function polygonToBbox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function labelMeToYolo(json, imgW, imgH, skipped, perClass, resolutions) {
  const lines = [];
  for (const shape of json.shapes ?? []) {
    const { id, how } = classIdForLabel(shape.label);
    if (id < 0) {
      const key = String(shape.label);
      const bucket = how === "non-disease" ? "non-disease" : "unresolved";
      const entry = `${bucket}: ${key}`;
      skipped.set(entry, (skipped.get(entry) ?? 0) + 1);
      continue;
    }
    const howKey = `${shape.label} -> class ${id} (via ${how})`;
    resolutions.set(howKey, (resolutions.get(howKey) ?? 0) + 1);
    perClass[id] = (perClass[id] ?? 0) + 1;

    const bbox = polygonToBbox(shape.points ?? []);
    if (!(bbox.w > 0) || !(bbox.h > 0)) continue;
    const xc = (bbox.x + bbox.w / 2) / imgW;
    const yc = (bbox.y + bbox.h / 2) / imgH;
    const w = bbox.w / imgW;
    const h = bbox.h / imgH;
    lines.push(`${id} ${xc.toFixed(6)} ${yc.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`);
  }
  return lines.join("\n");
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Deterministic shuffle so the split is reproducible but not sorted-by-filename. */
function shuffle(items, seed) {
  const out = items.slice();
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function main() {
  const seed = Number(arg("seed", "42"));

  ensureDir(OUT_DIR);
  writeFileSync(
    CLASSES_FILE,
    CLASS_DEFS.map(([id, name]) => `${id} ${name}`).join("\n") + "\n",
  );
  console.log(`wrote ${CLASSES_FILE} (${CLASS_DEFS.length} classes)`);

  const labelFiles = readdirSync(RAW_LABEL).filter((f) => f.endsWith(".json"));
  console.log(`found ${labelFiles.length} raw label files`);

  const samples = [];
  let missingImage = 0;
  for (const lf of labelFiles) {
    const json = JSON.parse(readFileSync(join(RAW_LABEL, lf), "utf8"));
    const imgName = json.imagePath ?? lf.replace(/\.json$/, ".png");
    const imgPath = join(RAW_INPUT, imgName);
    if (!existsSync(imgPath)) {
      missingImage += 1;
      continue;
    }
    samples.push({
      json,
      imgName,
      imgPath,
      imgW: json.imageWidth,
      imgH: json.imageHeight,
    });
  }
  if (missingImage) console.log(`skipped ${missingImage} label(s) with no matching image`);
  console.log(`matched ${samples.length} image/label pairs`);

  const ordered = shuffle(samples, seed);
  const n = ordered.length;
  const nTrain = Math.round(n * 0.8);
  const nVal = Math.round(n * 0.1);
  const splits = {
    train: ordered.slice(0, nTrain),
    val: ordered.slice(nTrain, nTrain + nVal),
    test: ordered.slice(nTrain + nVal),
  };

  // Clear previous output so the new split leaves no orphaned images behind.
  for (const split of Object.keys(splits)) {
    for (const base of [OUT_IMAGES, OUT_LABELS]) {
      const dir = join(base, split);
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    }
  }

  const skipped = new Map();
  const resolutions = new Map();
  const perClass = {};
  let emptyLabels = 0;
  for (const [split, items] of Object.entries(splits)) {
    const imgDir = join(OUT_IMAGES, split);
    const lblDir = join(OUT_LABELS, split);
    ensureDir(imgDir);
    ensureDir(lblDir);
    for (const s of items) {
      copyFileSync(s.imgPath, join(imgDir, s.imgName));
      const yolo = labelMeToYolo(s.json, s.imgW, s.imgH, skipped, perClass, resolutions);
      if (!yolo) emptyLabels += 1;
      writeFileSync(
        join(lblDir, s.imgName.replace(/\.png$/, ".txt")),
        yolo ? yolo + "\n" : "",
      );
    }
    console.log(`  ${split}: ${items.length} images + labels`);
  }

  const total = Object.values(perClass).reduce((a, b) => a + b, 0);
  console.log(`\nresolved ${total} box(es), per class:`);
  for (const [id, name] of CLASS_DEFS) {
    const count = perClass[id] ?? 0;
    const flag = count === 0 ? "   <-- EMPTY, model cannot learn it" : "";
    console.log(`  ${id} ${name.padEnd(12)} ${String(count).padStart(5)}${flag}`);
  }

  if (resolutions.size) {
    console.log(`\nresolution strategies used:`);
    const byHow = new Map();
    for (const k of resolutions.keys()) {
      const how = k.match(/\(via (.*)\)$/)?.[1] ?? "?";
      byHow.set(how, (byHow.get(how) ?? 0) + 1);
    }
    for (const [how, count] of byHow) console.log(`  ${String(count).padStart(5)}  via ${how}`);
  }

  const unresolved = [...skipped.entries()].filter(([l]) => l.startsWith("unresolved:"));
  const excluded = [...skipped.entries()].filter(([l]) => l.startsWith("non-disease:"));

  console.log(`\nEXCLUDED on purpose (not one of our 5 disease classes): ${excluded.length} spelling(s)`);
  const byWord = new Map();
  for (const [l, c] of excluded) {
    const word = l.split(": ")[1].split("-").slice(0, 2).join("-");
    byWord.set(word, (byWord.get(word) ?? 0) + c);
  }
  for (const [w, c] of [...byWord.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(c).padStart(5)}  ${w}`);
  }

  if (unresolved.length) {
    console.log(`\n*** WARNING: ${unresolved.length} unknown label spelling(s), check these: ***`);
    for (const [l, c] of unresolved) console.log(`  ${String(c).padStart(5)}  ${l}`);
  } else {
    console.log("\nno unknown spellings: every dropped box was a recognized non-disease class");
  }
  console.log(`\nempty label files (negative images): ${emptyLabels}`);
  console.log("next: node scripts/validate-xray-dataset.mjs");
}

main();
