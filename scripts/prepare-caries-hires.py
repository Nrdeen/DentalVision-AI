"""Build the high-res OralXrays Decay tiles for the caries specialist.

Does NOT start training. Leaves the original 1991x1127 films untouched.

    python scripts/prepare-caries-hires.py
    python scripts/prepare-caries-hires.py --limit 20

When you want training: python scripts/train-caries-hires.py
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from caries_hires import (  # noqa: E402
    JPEG_QUALITY,
    KEEP_IOA,
    OUT,
    SRC,
    TILE,
    TRAIN_JITTER,
    boxes_to_yolo_lines,
    clahe_rgb,
    crop_tile,
    lesion_window,
    parse_yolo_label,
    self_test,
    shift_boxes,
    windows_cover_boxes,
)

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def load_rgb(path: Path) -> np.ndarray:
    try:
        import cv2

        bgr = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if bgr is None:
            raise FileNotFoundError(path)
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    except ImportError:
        from PIL import Image

        return np.array(Image.open(path).convert("RGB"))


def save_jpg(path: Path, rgb: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        import cv2

        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        cv2.imwrite(str(path), bgr, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])
    except ImportError:
        from PIL import Image

        Image.fromarray(rgb).save(path, format="JPEG", quality=JPEG_QUALITY)


def write_yaml(dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    text = (
        "# High-res caries tiles from OralXrays-9 Decay. Cite chen2025OralXrays.\n"
        f"# {TILE} lesion-preserving crops + CLAHE matching clinic ingest.\n"
        "# KEEP_IOA=0.75 so clipped boxes do not train sloppy localization.\n"
        f"path: {dest.as_posix()}\n"
        "train: train/images\n"
        "val: valid/images\n"
        "test: valid/images\n"
        "nc: 1\n"
        "names:\n"
        "  0: caries\n"
    )
    (dest / "caries.yaml").write_text(text, encoding="utf-8")


def process_split(
    split: str,
    jitter: int,
    limit: int,
    seed: int,
) -> dict[str, int]:
    img_dir = SRC / split / "images"
    lbl_dir = SRC / split / "labels"
    out_img = OUT / split / "images"
    out_lbl = OUT / split / "labels"
    out_img.mkdir(parents=True, exist_ok=True)
    out_lbl.mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXTS)
    if limit > 0:
        files = files[:limit]

    rng = np.random.default_rng(seed)
    n_src = 0
    n_tiles = 0
    n_boxes = 0
    n_skip = 0

    for i, img_path in enumerate(files, start=1):
        label_path = lbl_dir / f"{img_path.stem}.txt"
        if not label_path.is_file():
            n_skip += 1
            continue
        rgb = load_rgb(img_path)
        h, w = rgb.shape[:2]
        boxes = parse_yolo_label(label_path.read_text(encoding="utf-8"), w, h)
        if not boxes:
            n_skip += 1
            continue
        enhanced = clahe_rgb(rgb)
        if jitter > 0:
            windows = [lesion_window(w, h, box, tile=TILE, jitter=jitter, rng=rng) for box in boxes]
        else:
            windows = windows_cover_boxes(w, h, boxes, tile=TILE)

        written = 0
        for t_i, (x0, y0, side) in enumerate(windows):
            shifted = shift_boxes(boxes, x0, y0, side, min_ioa=KEEP_IOA)
            if not shifted:
                continue
            tile = crop_tile(enhanced, x0, y0, side)
            stem = f"{img_path.stem}_t{t_i:02d}"
            save_jpg(out_img / f"{stem}.jpg", tile)
            (out_lbl / f"{stem}.txt").write_text(boxes_to_yolo_lines(shifted, side), encoding="utf-8")
            n_tiles += 1
            n_boxes += len(shifted)
            written += 1
        if written:
            n_src += 1
        if i % 200 == 0 or i == len(files):
            print(f"       {split} {i}/{len(files)} tiles={n_tiles}", flush=True)

    return {
        "source_images": n_src,
        "tiles": n_tiles,
        "boxes": n_boxes,
        "skipped": n_skip,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--limit", type=int, default=0, help="optional cap per split for a smoke run")
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args()

    self_test()
    print("[OK] geometry self-test passed")
    if not (SRC / "train" / "images").is_dir():
        print(f"[FATAL] missing source {SRC}")
        print("        prepare OralXrays specialists first")
        return 2

    print("[INFO] high-res caries tiles")
    print(f"       src {SRC}")
    print(f"       out {OUT}")
    print(f"       tile={TILE}px  train jitter={TRAIN_JITTER}px  CLAHE on")

    stats = {
        "tile": TILE,
        "train": process_split("train", TRAIN_JITTER, args.limit, args.seed),
        "valid": process_split("valid", 0, args.limit, args.seed + 1),
    }
    write_yaml(OUT)
    (OUT / "manifest.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print("\n[OK] caries-hires ready — training not started")
    print(f"     train tiles={stats['train']['tiles']} from {stats['train']['source_images']} films")
    print(f"     valid tiles={stats['valid']['tiles']} from {stats['valid']['source_images']} films")
    print("     launcher (later): python scripts/train-caries-hires.py")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
