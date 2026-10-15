/**
 * Validate the YOLO-format X-ray dataset under data/xray/.
 *
 * Checks, per split (train/val/test):
 *   - image count === label count, and every image has a label and vice versa
 *   - every row has exactly 5 whitespace-separated fields
 *   - class id is an integer inside the range declared by classes.txt
 *   - cx, cy, w, h are finite numbers in [0, 1]
 *   - the box stays inside the image: cx - w/2 >= -eps and cx + w/2 <= 1 + eps
 *   - w > 0 and h > 0
 *   - counts of empty label files (reported separately, since DENTEX images
 *     with no known annotation are legitimate negatives)
 *   - class id histogram
 *
 * Exit code 0 = no errors (empty labels are warnings), 1 = at least one error.
 *
 * Usage: node scripts/validate-xray-dataset.mjs [dataDir]
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, process.argv[2] ?? "data/xray");
const SPLITS = ["train", "val", "test"];
const EPS = 1e-6;

const errors = [];
const warnings = [];

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext));
}

function readClasses(file) {
  if (!existsSync(file)) {
    errors.push(`missing class list: ${file}`);
    return [];
  }
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, ...rest] = line.split(/\s+/);
      return { id: Number(id), name: rest.join(" ") };
    })
    .sort((a, b) => a.id - b.id);
}

const classes = readClasses(join(DATA_DIR, "classes.txt"));
const validIds = new Set(classes.map((c) => c.id));
console.log(`classes.txt: ${classes.length} classes`);
for (const c of classes) console.log(`  ${c.id} ${c.name}`);

const nameOf = (id) => classes.find((c) => c.id === id)?.name ?? "?";
const histogram = new Map();

for (const split of SPLITS) {
  const imgDir = join(DATA_DIR, "images", split);
  const lblDir = join(DATA_DIR, "labels", split);
  const images = listFiles(imgDir, ".png");
  const labels = listFiles(lblDir, ".txt");
  const imgIds = new Set(images.map((f) => f.replace(/\.png$/, "")));
  const lblIds = new Set(labels.map((f) => f.replace(/\.txt$/, "")));

  console.log(`\n[${split}] images=${images.length} labels=${labels.length}`);

  for (const id of imgIds) {
    if (!lblIds.has(id)) errors.push(`[${split}] ${id}: image without label`);
  }
  for (const id of lblIds) {
    if (!imgIds.has(id)) errors.push(`[${split}] ${id}: label without image`);
  }

  let empty = 0;
  let rows = 0;
  for (const file of labels) {
    const id = file.replace(/\.txt$/, "");
    const text = readFileSync(join(lblDir, file), "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) {
      empty += 1;
      warnings.push(`[${split}] ${id}: empty label file (treated as a negative image)`);
      continue;
    }
    lines.forEach((line, i) => {
      rows += 1;
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 5) {
        errors.push(`[${split}] ${id} line ${i + 1}: expected 5 fields, got ${parts.length}`);
        return;
      }
      const [cidRaw, ...nums] = parts;
      const cid = Number(cidRaw);
      if (!Number.isInteger(cid) || !validIds.has(cid)) {
        errors.push(`[${split}] ${id} line ${i + 1}: class id "${cidRaw}" not in classes.txt`);
        return;
      }
      histogram.set(cid, (histogram.get(cid) ?? 0) + 1);
      const [cx, cy, w, h] = nums.map(Number);
      for (const [name, v] of [
        ["cx", cx],
        ["cy", cy],
        ["w", w],
        ["h", h],
      ]) {
        if (!Number.isFinite(v)) {
          errors.push(`[${split}] ${id} line ${i + 1}: ${name} is not a number`);
          return;
        }
        if (v < -EPS || v > 1 + EPS) {
          errors.push(`[${split}] ${id} line ${i + 1}: ${name}=${v} outside [0, 1]`);
        }
      }
      if (w <= 0 || h <= 0) errors.push(`[${split}] ${id} line ${i + 1}: w/h must be > 0`);
      if (cx - w / 2 < -EPS || cx + w / 2 > 1 + EPS) {
        errors.push(`[${split}] ${id} line ${i + 1}: box leaves the image (cx=${cx}, w=${w})`);
      }
      if (cy - h / 2 < -EPS || cy + h / 2 > 1 + EPS) {
        errors.push(`[${split}] ${id} line ${i + 1}: box leaves the image (cy=${cy}, h=${h})`);
      }
    });
  }
  console.log(`[${split}] boxes=${rows} emptyLabels=${empty}`);
}

console.log("\nclass histogram (boxes per class):");
for (const c of classes) {
  console.log(`  ${c.id} ${c.name.padEnd(12)} ${histogram.get(c.id) ?? 0}`);
}
for (const [cid, n] of histogram) {
  if (!validIds.has(cid)) errors.push(`class id ${cid} appears in labels but not in classes.txt`);
  else if (n === 0) warnings.push(`class ${cid} (${nameOf(cid)}) has zero boxes`);
}

console.log("");
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);
