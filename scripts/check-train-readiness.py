"""Pre-flight check for the DentaAI YOLO training run.

Verifies the dataset layout, classes.txt <-> data.yaml agreement, image/label
pairing, and the torch/ultralytics environment (including CUDA availability
for the NVIDIA GeForce MX330).

Run:  python scripts/check-train-readiness.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Windows consoles default to a legacy codepage (cp1252/cp1256) and cannot
# encode the Turkish characters in classes.txt. Force UTF-8 with a safe
# fallback so the report always prints.
for _stream in ("stdout", "stderr"):
    try:
        getattr(sys, _stream).reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

try:
    import yaml
except ImportError:  # PyYAML ships with ultralytics, but be explicit.
    yaml = None

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "xray"
SPLITS = ("train", "val", "test")
IMG_EXT = (".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff")
REQUIRED_DIRS = [
    DATA / "images" / "train",
    DATA / "images" / "val",
    DATA / "labels" / "train",
    DATA / "labels" / "val",
]
REQUIRED_FILES = [DATA / "classes.txt", DATA / "data.yaml"]

errors: list[str] = []
warnings: list[str] = []


def ok(msg: str) -> None:
    print(f"  [OK]   {msg}")


def warn(msg: str) -> None:
    warnings.append(msg)
    print(f"  [WARN] {msg}")


def fail(msg: str) -> None:
    errors.append(msg)
    print(f"  [FAIL] {msg}")


# ---------------------------------------------------------------- 1. layout
print("\n1. Dataset directories and files")
for d in REQUIRED_DIRS:
    if d.is_dir():
        ok(f"dir  {d.relative_to(ROOT)}")
    else:
        fail(f"missing dir  {d.relative_to(ROOT)}")
for f in REQUIRED_FILES:
    if f.is_file():
        ok(f"file {f.relative_to(ROOT)}")
    else:
        fail(f"missing file {f.relative_to(ROOT)}")

# ------------------------------------------------------------- 2. classes
print("\n2. classes.txt")
class_ids: dict[int, str] = {}
classes_txt = DATA / "classes.txt"
if classes_txt.is_file():
    for lineno, raw in enumerate(
        classes_txt.read_text(encoding="utf-8").splitlines(), start=1
    ):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split(None, 1)
        if len(parts) != 2 or not parts[0].isdigit():
            fail(f"classes.txt:{lineno} malformed -> {line!r}")
            continue
        cid, name = int(parts[0]), parts[1].strip()
        if cid in class_ids:
            fail(f"classes.txt:{lineno} duplicate class id {cid}")
        class_ids[cid] = name
        ok(f"  id {cid} -> {name}")
    if class_ids and sorted(class_ids) != list(range(len(class_ids))):
        fail(f"class ids are not contiguous 0..{len(class_ids) - 1}")
    elif class_ids:
        ok(f"{len(class_ids)} classes, ids contiguous from 0")

# ------------------------------------------------------------- 3. data.yaml
print("\n3. data.yaml")
data_yaml = DATA / "data.yaml"
yaml_names: dict[int, str] = {}
yaml_nc = None
if data_yaml.is_file():
    text = data_yaml.read_text(encoding="utf-8")
    print(text.rstrip())
    if yaml is None:
        warn("PyYAML not importable; skipping structural parse of data.yaml")
    else:
        cfg = yaml.safe_load(text) or {}
        yaml_nc = cfg.get("nc")
        names = cfg.get("names")
        if isinstance(names, dict):
            yaml_names = {
                int(k): str(v).split("#")[0].strip() for k, v in names.items()
            }
        elif isinstance(names, (list, tuple)):
            yaml_names = {i: str(n) for i, n in enumerate(names)}
        else:
            fail("data.yaml has no usable 'names' mapping")

        for key in ("path", "train", "val", "test"):
            if not cfg.get(key):
                fail(f"data.yaml missing '{key}'")

        if class_ids and yaml_nc != len(class_ids):
            fail(f"data.yaml nc={yaml_nc} but classes.txt has {len(class_ids)} classes")
        elif yaml_nc is not None:
            ok(f"nc={yaml_nc} matches classes.txt ({len(class_ids)} classes)")

        if class_ids and yaml_names and yaml_names != class_ids:
            for cid in sorted(set(class_ids) | set(yaml_names)):
                a = class_ids.get(cid, "<missing>")
                b = yaml_names.get(cid, "<missing>")
                if a != b:
                    fail(f"class {cid} mismatch: classes.txt={a!r} data.yaml={b!r}")
        elif yaml_names:
            ok("class names and order match classes.txt exactly")

        base = ROOT / str(cfg.get("path", "data/xray"))
        for key in ("train", "val", "test"):
            p = base / str(cfg.get(key, ""))
            if not p.is_dir():
                fail(f"data.yaml '{key}' points at missing dir {p}")

# ------------------------------------------------- 4. images <-> labels
print("\n4. Image / label pairs and label sanity")
nc = len(class_ids) or (yaml_nc or 0)
empty_labels = 0
for split in SPLITS:
    img_dir = DATA / "images" / split
    lbl_dir = DATA / "labels" / split
    if not img_dir.is_dir() or not lbl_dir.is_dir():
        continue
    imgs = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMG_EXT)
    lbls = sorted(p for p in lbl_dir.iterdir() if p.suffix == ".txt")
    if not imgs:
        fail(f"{split}: no images")
        continue
    ok(f"{split}: {len(imgs)} images, {len(lbls)} labels")
    if len(imgs) != len(lbls):
        fail(f"{split}: image count != label count ({len(imgs)} vs {len(lbls)})")

    img_stems = {p.stem for p in imgs}
    lbl_stems = {p.stem for p in lbls}
    for stem in sorted(img_stems - lbl_stems)[:10]:
        fail(f"{split}: image {stem} has no label file")
    for stem in sorted(lbl_stems - img_stems)[:10]:
        fail(f"{split}: label {stem} has no image")

    bad = 0
    for lbl in lbls:
        lines = [ln.strip() for ln in lbl.read_text(encoding="utf-8").splitlines()]
        lines = [ln for ln in lines if ln and not ln.startswith("#")]
        if not lines:
            empty_labels += 1
            continue
        for ln in lines:
            f = ln.split()
            if len(f) != 5:
                bad += 1
                if bad <= 5:
                    fail(f"{split}/{lbl.name}: expected 5 fields, got {len(f)}")
                continue
            try:
                cid = int(f[0])
                vals = [float(v) for v in f[1:]]
            except ValueError:
                bad += 1
                if bad <= 5:
                    fail(f"{split}/{lbl.name}: non-numeric field in {ln!r}")
                continue
            if nc and not (0 <= cid < nc):
                bad += 1
                if bad <= 5:
                    fail(f"{split}/{lbl.name}: class id {cid} outside 0..{nc - 1}")
            for v in vals:
                if not (0.0 <= v <= 1.0):
                    bad += 1
                    if bad <= 5:
                        fail(f"{split}/{lbl.name}: coordinate {v} outside 0..1")
                    break
            if vals[2] <= 0 or vals[3] <= 0:
                bad += 1
                if bad <= 5:
                    fail(f"{split}/{lbl.name}: non-positive width/height")
    if bad == 0:
        ok(f"{split}: all label rows well-formed")
    else:
        fail(f"{split}: {bad} malformed label rows")

if empty_labels:
    warn(
        f"{empty_labels} label file(s) are empty -> treated as negative/background "
        "images. If unexpected, re-run scripts/migrate-xray-data.mjs"
    )

# ------------------------------------------------- 5. python environment
print("\n5. Python environment")
try:
    import torch

    print(f"  torch       {torch.__version__}")
    print(f"  cuda built  {torch.version.cuda}")
    if torch.cuda.is_available():
        dev = torch.cuda.get_device_name(0)
        total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"  device      {dev} ({total:.1f} GiB VRAM)")
        if total < 2.5:
            warn(
                f"only {total:.1f} GiB VRAM: start with batch=2 imgsz=640, and fall "
                "back to batch=1 / imgsz=512 on CUDA OOM"
            )
    else:
        warn("CUDA not available -> training will fall back to CPU (very slow)")
except ImportError:
    fail("PyTorch is not installed in this interpreter")

try:
    import ultralytics

    print(f"  ultralytics {ultralytics.__version__}")
except ImportError:
    fail("ultralytics is not installed in this interpreter")

# ------------------------------------------------------------- summary
print("\n" + "=" * 60)
if errors:
    print(f"NOT READY: {len(errors)} blocking issue(s), {len(warnings)} warning(s)")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print(f"READY TO TRAIN ({len(warnings)} warning(s))")
sys.exit(0)
