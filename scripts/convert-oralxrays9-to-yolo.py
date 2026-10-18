"""Convert OralXrays-9 COCO 2017 annotations to YOLO detect format.

Keeps the official 9 class names. Category 0 (31 stray boxes) is dropped.
Images are hard-linked when the volume allows it, otherwise copied.

    python scripts/convert-oralxrays9-to-yolo.py
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "oralxrays9-raw" / "unzipped"
OUT = ROOT / "data" / "oralxrays9-yolo"

SPLITS = (
    ("train", "instances_train2017.json", "train2017", "train"),
    ("val", "instances_val2017.json", "val2017", "valid"),
)

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def coco_bbox_to_yolo(bbox: list, img_width: int, img_height: int) -> list[float] | None:
    x, y, w, h = (float(v) for v in bbox)
    if w <= 0 or h <= 0 or img_width <= 0 or img_height <= 0:
        return None
    x_c = (x + w / 2) / img_width
    y_c = (y + h / 2) / img_height
    nw = w / img_width
    nh = h / img_height
    if min(x_c, y_c, nw, nh) < 0:
        return None
    x_c = min(max(x_c, 0.0), 1.0)
    y_c = min(max(y_c, 0.0), 1.0)
    nw = min(max(nw, 0.0), 1.0)
    nh = min(max(nh, 0.0), 1.0)
    if nw <= 0 or nh <= 0:
        return None
    return [x_c, y_c, nw, nh]


def link_or_copy(src: Path, dest: Path) -> None:
    if dest.exists():
        return
    try:
        dest.hardlink_to(src)
    except OSError:
        shutil.copy2(src, dest)


def find_image(split_dir: Path, file_name: str) -> Path | None:
    direct = split_dir / file_name
    if direct.is_file():
        return direct
    stem = Path(file_name).stem
    for ext in IMG_EXTS:
        cand = split_dir / f"{stem}{ext}"
        if cand.is_file():
            return cand
    nested = split_dir / Path(file_name).name
    if nested.is_file():
        return nested
    return None


def process_split(
    coco_path: Path,
    image_dir: Path,
    out_split: Path,
    cat_to_yolo: dict[int, int],
) -> tuple[int, int]:
    data = json.loads(coco_path.read_text(encoding="utf-8"))
    images = {img["id"]: img for img in data["images"]}
    by_image: dict[int, list] = defaultdict(list)
    skipped_cat = 0
    skipped_box = 0
    for ann in data["annotations"]:
        cid = int(ann.get("category_id", -1))
        if cid not in cat_to_yolo:
            skipped_cat += 1
            continue
        img = images.get(ann["image_id"])
        if not img:
            continue
        yolo = coco_bbox_to_yolo(ann["bbox"], img["width"], img["height"])
        if yolo is None:
            skipped_box += 1
            continue
        by_image[ann["image_id"]].append((cat_to_yolo[cid], yolo))

    out_img = out_split / "images"
    out_lbl = out_split / "labels"
    out_img.mkdir(parents=True, exist_ok=True)
    out_lbl.mkdir(parents=True, exist_ok=True)

    kept = 0
    missing_files = 0
    for img_id, img in images.items():
        rows = by_image.get(img_id) or []
        if not rows:
            continue
        src = find_image(image_dir, img["file_name"])
        if src is None:
            missing_files += 1
            continue
        dest_name = src.name
        link_or_copy(src, out_img / dest_name)
        lines = [f"{cid} {bbox[0]:.6f} {bbox[1]:.6f} {bbox[2]:.6f} {bbox[3]:.6f}\n" for cid, bbox in rows]
        (out_lbl / f"{src.stem}.txt").write_text("".join(lines), encoding="utf-8")
        kept += 1

    print(
        f"       images={kept} skipped_cat={skipped_cat} skipped_box={skipped_box} missing_files={missing_files}"
    )
    return kept, missing_files


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default=str(RAW))
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()
    src = Path(args.src)
    out = Path(args.out)
    if not src.is_absolute():
        src = ROOT / src
    if not out.is_absolute():
        out = ROOT / out

    train_json = src / "annotations" / "instances_train2017.json"
    if not train_json.is_file():
        print(f"[FATAL] missing {train_json}")
        print("        unzip first: python scripts/unzip-oralxrays9.py")
        return 2

    meta = json.loads(train_json.read_text(encoding="utf-8"))
    categories = {int(c["id"]): str(c["name"]) for c in meta["categories"]}
    ordered_ids = sorted(categories)
    cat_to_yolo = {cid: i for i, cid in enumerate(ordered_ids)}
    names = [categories[cid] for cid in ordered_ids]
    print(f"[INFO] {len(names)} classes: {names}")

    out.mkdir(parents=True, exist_ok=True)
    totals = {}
    for _, json_name, img_folder, yolo_split in SPLITS:
        coco_path = src / "annotations" / json_name
        image_dir = src / img_folder
        print(f"\n[INFO] {yolo_split}: {coco_path.name}  images={image_dir}")
        if not coco_path.is_file():
            print(f"[FATAL] missing {coco_path}")
            return 2
        if not image_dir.is_dir():
            print(f"[FATAL] missing image folder {image_dir}")
            return 2
        kept, missing = process_split(coco_path, image_dir, out / yolo_split, cat_to_yolo)
        totals[yolo_split] = (kept, missing)

    yaml_lines = [
        "# OralXrays-9 (Chen et al., CVPR 2025). Cite chen2025OralXrays.",
        f"path: {out.as_posix()}",
        "train: train/images",
        "val: valid/images",
        "test: valid/images",
        f"nc: {len(names)}",
        "names:",
    ]
    for i, name in enumerate(names):
        yaml_lines.append(f"  {i}: {name}")
    (out / "data.yaml").write_text("\n".join(yaml_lines) + "\n", encoding="utf-8")
    print(f"\n[OK] wrote {out / 'data.yaml'}")
    for split, (kept, missing) in totals.items():
        print(f"     {split}: {kept} labelled images (missing files={missing})")
    print("[INFO] next: python scripts/split-oralxrays-specialists.py")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
