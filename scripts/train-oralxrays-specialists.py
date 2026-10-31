"""Train OralXrays-9 specialists.

Caries uses the high-res tile launcher, not this 640/nano path:
    python scripts/prepare-caries-hires.py
    python scripts/train-caries-hires.py

Default remaining queue here: periapical (after caries-hires).
Do not enable a class in the product until YOUR val mAP50 >= 90.

This script starts GPU/CPU training as soon as it is invoked. Do not run it
until the user explicitly asks to start training.

    python scripts/train-oralxrays-specialists.py --only periapical
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC_ROOT = ROOT / "data" / "xray" / "specialists" / "oralxrays"
WEIGHT_DIR = ROOT / "models" / "xray" / "specialists"

QUEUE = (
    ("periapical", "periapical.yaml"),
)
ALREADY_TRAINED = (
    ("implant", "implant.yaml"),
    ("restorations", "restorations.yaml"),
    ("missing", "missing.yaml"),
    ("impaction", "impaction.yaml"),
)


def is_oom(exc: BaseException) -> bool:
    text = f"{type(exc).__name__}: {exc}".lower()
    return "out of memory" in text or "cuda error: out of memory" in text


def pin_yaml_dataset_root(yaml_path: Path) -> Path:
    """Point `path:` at this machine's drive letter (E: laptop / G: desktop)."""
    root = yaml_path.parent.resolve()
    images = root / "valid" / "images"
    if not images.is_dir():
        print(f"[FATAL] images missing: {images}")
        raise FileNotFoundError(images)
    lines: list[str] = []
    replaced = False
    for line in yaml_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("path:"):
            lines.append(f"path: {root.as_posix()}")
            replaced = True
        else:
            lines.append(line)
    if not replaced:
        insert_at = 1 if lines and lines[0].startswith("#") else 0
        lines.insert(insert_at, f"path: {root.as_posix()}")
    yaml_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[INFO] dataset root {root}")
    return yaml_path


def train_one(
    spec: str,
    yaml_name: str,
    model: str,
    epochs: int,
    imgsz: int,
    batch: int,
    workers: int,
    device: str,
    patience: int,
) -> int:
    data = SPEC_ROOT / spec / yaml_name
    if not data.is_file():
        print(f"[FATAL] missing {data}")
        print("        prepare first: python scripts/prepare-oralxrays9.py")
        return 2
    try:
        data = pin_yaml_dataset_root(data)
    except FileNotFoundError:
        return 2

    try:
        import torch
        from ultralytics import YOLO
    except ImportError as exc:
        print(f"[FATAL] missing dependency: {exc}")
        return 2

    if device != "cpu" and not torch.cuda.is_available():
        print("[WARN] CUDA unavailable -> device=cpu")
        device = "cpu"

    attempts = [
        {"imgsz": imgsz, "batch": batch},
        {"imgsz": imgsz, "batch": 1},
        {"imgsz": 512, "batch": 1},
    ]
    seen: set[tuple[int, int]] = set()
    ordered = []
    for a in attempts:
        key = (a["imgsz"], a["batch"])
        if key not in seen:
            seen.add(key)
            ordered.append(a)

    out_name = f"oralxrays-{spec}"
    for i, cfg in enumerate(ordered, start=1):
        print("\n" + "=" * 60)
        print(f"[INFO] {spec} attempt {i}/{len(ordered)} imgsz={cfg['imgsz']} batch={cfg['batch']}")
        print("=" * 60)
        try:
            yolo = YOLO(model)
            yolo.train(
                data=str(data),
                epochs=epochs,
                imgsz=cfg["imgsz"],
                batch=cfg["batch"],
                device=device,
                workers=workers,
                patience=patience,
                project=str(ROOT / "runs" / "xray-oralxrays"),
                name=out_name,
                exist_ok=True,
            )
            best = ROOT / "runs" / "xray-oralxrays" / out_name / "weights" / "best.pt"
            if best.is_file():
                WEIGHT_DIR.mkdir(parents=True, exist_ok=True)
                dest = WEIGHT_DIR / f"{spec}.pt"
                dest.write_bytes(best.read_bytes())
                print(f"[OK] copied {best} -> {dest}")
            return 0
        except BaseException as exc:  # noqa: BLE001
            if is_oom(exc) and i < len(ordered):
                print(f"[FAIL] CUDA OOM at imgsz={cfg['imgsz']} batch={cfg['batch']}")
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass
                continue
            print(f"[FAIL] {spec}: {type(exc).__name__}: {exc}")
            return 1
    return 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--model", default="yolo11n.pt")
    ap.add_argument("--epochs", type=int, default=80)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=2)
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--device", default="0")
    ap.add_argument("--patience", type=int, default=15)
    ap.add_argument("--only", default="", help="comma-separated specialist ids")
    ap.add_argument(
        "--include-trained",
        action="store_true",
        help="also re-train implant / restorations / missing / impaction",
    )
    args = ap.parse_args()

    wanted = {s.strip() for s in args.only.split(",") if s.strip()} if args.only else set()
    if "caries" in wanted:
        if wanted == {"caries"}:
            print("[INFO] caries uses scripts/train-caries-hires.py")
            return subprocess.call([sys.executable, str(ROOT / "scripts" / "train-caries-hires.py")])
        print("[INFO] dropping caries from this launcher; run python scripts/train-caries-hires.py")
        wanted.discard("caries")

    catalog = list(QUEUE) + list(ALREADY_TRAINED)
    queue = list(QUEUE)
    if args.include_trained:
        queue.extend(ALREADY_TRAINED)
    if wanted:
        queue = [item for item in catalog if item[0] in wanted]
        if not queue:
            print(f"[FATAL] --only did not match any specialist: {wanted}")
            return 2

    print("[INFO] OralXrays-9 training queue:", ", ".join(s for s, _ in queue))
    print("[INFO] enable a class only after YOUR val mAP50 >= 90")
    for spec, yaml_name in queue:
        code = train_one(
            spec,
            yaml_name,
            args.model,
            args.epochs,
            args.imgsz,
            args.batch,
            args.workers,
            args.device,
            args.patience,
        )
        if code != 0:
            return code
    print("\n[OK] all queued specialists finished")
    print("     enable a class in src/lib/dentaai/ensemble.ts only after YOUR val mAP50 >= 90")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
