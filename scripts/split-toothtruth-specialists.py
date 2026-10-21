"""Split a YOLO panoramic dataset into specialist subsets.

Each specialist keeps only the clinical classes it is allowed to learn.
Images that have none of those classes are skipped so missing labels do not
teach the model that a disease is background.

    python scripts/split-toothtruth-specialists.py
    python scripts/split-toothtruth-specialists.py --src data/toothtruth-yolo --out data/xray/specialists
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import yaml

from xray_taxonomy import ROOT, route_class

SPECIALISTS = {
    "impaction": {
        "keys": {"impacted"},
        "yaml": "impaction.yaml",
    },
    "implant": {
        "keys": {"implant"},
        "yaml": "implant.yaml",
    },
    "missing": {
        "keys": {"missingTooth"},
        "yaml": "missing.yaml",
    },
    "restorations": {
        "keys": {"rootCanal", "filling", "crown", "bridge", "retainedRoot"},
        "yaml": "restorations.yaml",
    },
    "caries": {
        "keys": {"caries", "deepCaries", "xrayKuretaj"},
        "yaml": "caries.yaml",
    },
    "periapical": {
        "keys": {"periapical"},
        "yaml": "periapical.yaml",
    },
    "bone": {
        "keys": {"boneLoss"},
        "yaml": "bone.yaml",
    },
}


def load_names(data_yaml: Path) -> dict[int, str]:
    raw = yaml.safe_load(data_yaml.read_text(encoding="utf-8"))
    names = raw.get("names") or {}
    if isinstance(names, list):
        return {i: str(n) for i, n in enumerate(names)}
    return {int(k): str(v) for k, v in names.items()}


def key_index(names: dict[int, str], wanted: set[str]) -> dict[str, int]:
    ordered = sorted({route_class(i, n).key for i, n in names.items() if route_class(i, n).key in wanted})
    return {key: i for i, key in enumerate(ordered)}


def remap_label_line(line: str, names: dict[int, str], wanted: set[str], index: dict[str, int]) -> str | None:
    parts = line.split()
    if len(parts) < 5:
        return None
    cls_id = int(float(parts[0]))
    routed = route_class(cls_id, names.get(cls_id, str(cls_id)))
    if routed.key not in wanted or routed.policy == "anatomy" or routed.key not in index:
        return None
    return f"{index[routed.key]} {' '.join(parts[1:])}\n"


def copy_split(src: Path, dest: Path, names: dict[int, str], wanted: set[str], split: str) -> int:
    img_dir = src / split / "images"
    lbl_dir = src / split / "labels"
    if not img_dir.is_dir():
        return 0
    out_img = dest / split / "images"
    out_lbl = dest / split / "labels"
    out_img.mkdir(parents=True, exist_ok=True)
    out_lbl.mkdir(parents=True, exist_ok=True)
    index = key_index(names, wanted)
    kept = 0
    for image in img_dir.iterdir():
        if image.suffix.lower() not in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}:
            continue
        label = lbl_dir / f"{image.stem}.txt"
        if not label.is_file():
            continue
        kept_lines: list[str] = []
        for line in label.read_text(encoding="utf-8").splitlines():
            mapped = remap_label_line(line, names, wanted, index)
            if mapped:
                kept_lines.append(mapped)
        if not kept_lines:
            continue
        dest_img = out_img / image.name
        if not dest_img.exists():
            try:
                dest_img.hardlink_to(image)
            except OSError:
                shutil.copy2(image, dest_img)
        (out_lbl / f"{image.stem}.txt").write_text("".join(kept_lines), encoding="utf-8")
        kept += 1
    return kept


def write_yaml(dest: Path, names: dict[int, str], wanted: set[str], yaml_name: str) -> None:
    ordered = sorted({route_class(i, n).key for i, n in names.items() if route_class(i, n).key in wanted})
    body = [
        f"# Specialist subset generated from {dest.parent.name}",
        "# path is rewritten at train time to this folder (E: or G:).",
        f"path: {dest.resolve().as_posix()}",
        "train: train/images",
        "val: valid/images",
        "test: test/images",
        f"nc: {len(ordered)}",
        "names:",
    ]
    for i, key in enumerate(ordered):
        body.append(f"  {i}: {key}")
    (dest / yaml_name).write_text("\n".join(body) + "\n", encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default=str(ROOT / "data" / "toothtruth-yolo"))
    ap.add_argument("--out", default=str(ROOT / "data" / "xray" / "specialists"))
    args = ap.parse_args()
    src = Path(args.src)
    if not src.is_absolute():
        src = ROOT / src
    data_yaml = src / "data.yaml"
    if not data_yaml.is_file():
        print(f"[FATAL] missing {data_yaml}")
        print("        convert ToothTruth first: python scripts/convert-toothtruth-coco-to-yolo.py")
        return 2
    names = load_names(data_yaml)
    out_root = Path(args.out)
    if not out_root.is_absolute():
        out_root = ROOT / out_root
    out_root.mkdir(parents=True, exist_ok=True)

    for spec, cfg in SPECIALISTS.items():
        dest = out_root / spec
        print(f"\n[INFO] specialist={spec} keys={sorted(cfg['keys'])}")
        total = 0
        for split in ("train", "valid", "test"):
            n = copy_split(src, dest, names, cfg["keys"], split)
            print(f"       {split}: {n} images")
            total += n
        write_yaml(dest, names, cfg["keys"], cfg["yaml"])
        print(f"       total={total} -> {dest / cfg['yaml']}")
        print(
            f"       train: python scripts/train-yolo.py --data {dest / cfg['yaml']} --model yolo11m.pt --imgsz 1280 --epochs 150"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
