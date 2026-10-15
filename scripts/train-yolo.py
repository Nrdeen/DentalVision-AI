"""Launch the DentaAI X-ray YOLO training run with low-VRAM fallbacks.

Equivalent to:
    yolo detect train model=yolo11n.pt data=data/xray/data.yaml \
        epochs=50 imgsz=640 batch=2 device=0 workers=2

The raw `yolo` CLI is not always on PATH (conda/venv/py-launcher setups), so
this drives the ultralytics Python API instead. It runs the requested
configuration first and, if CUDA runs out of memory, automatically retries
with the documented fallbacks: batch=1, then imgsz=512.

Run from the project root:
    python scripts/train-yolo.py
    python scripts/train-yolo.py --epochs 50 --batch 2 --imgsz 640
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

for _stream in ("stdout", "stderr"):
    try:
        getattr(sys, _stream).reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parent.parent
DATA_YAML = ROOT / "data" / "xray" / "data.yaml"


def is_oom(exc: BaseException) -> bool:
    text = f"{type(exc).__name__}: {exc}".lower()
    return "out of memory" in text or "cuda error: out of memory" in text


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--model", default="yolo11n.pt", help="pretrained checkpoint")
    ap.add_argument("--data", default=str(DATA_YAML), help="dataset yaml")
    ap.add_argument("--epochs", type=int, default=50)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=2)
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--device", default="0", help="0 for GPU, cpu for CPU")
    ap.add_argument(
        "--patience",
        type=int,
        default=None,
        help="early stopping patience (ultralytics default when unset)",
    )
    args = ap.parse_args()

    data = Path(args.data)
    if not data.is_absolute():
        data = ROOT / data
    if not data.is_file():
        print(f"[FATAL] dataset yaml not found: {data}")
        return 2

    try:
        import torch
        from ultralytics import YOLO
    except ImportError as exc:
        print(f"[FATAL] missing dependency: {exc}")
        print("        install with:  pip install ultralytics")
        return 2

    if args.device != "cpu" and not torch.cuda.is_available():
        print("[WARN] CUDA unavailable -> forcing device=cpu (this will be slow)")
        args.device = "cpu"
    elif args.device != "cpu":
        total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"[INFO] GPU: {torch.cuda.get_device_name(0)} ({total:.1f} GiB VRAM)")
        if total < 2.5:
            print("[INFO] Low VRAM: batch=2 imgsz=640 is the intended start point;")
            print("       on CUDA OOM this script retries batch=1, then imgsz=512.")

    # Requested config first, then the documented low-VRAM fallbacks.
    attempts = [
        {"imgsz": args.imgsz, "batch": args.batch},
        {"imgsz": args.imgsz, "batch": 1},
        {"imgsz": 512, "batch": 1},
    ]
    seen: set[tuple[int, int]] = set()
    ordered = []
    for a in attempts:
        key = (a["imgsz"], a["batch"])
        if key not in seen:
            seen.add(key)
            ordered.append(a)

    for i, cfg in enumerate(ordered, start=1):
        print("\n" + "=" * 60)
        print(f"[INFO] attempt {i}/{len(ordered)}: imgsz={cfg['imgsz']} batch={cfg['batch']}")
        print("=" * 60)
        try:
            model = YOLO(args.model)
            train_kwargs = dict(
                data=str(data),
                epochs=args.epochs,
                imgsz=cfg["imgsz"],
                batch=cfg["batch"],
                device=args.device,
                workers=args.workers,
            )
            if args.patience is not None:
                train_kwargs["patience"] = args.patience
            model.train(**train_kwargs)
            best = getattr(model, "trainer", None)
            best_path = getattr(best, "best", None) if best else None
            print("\n[OK] training finished")
            if best_path:
                print(f"[OK] best weights: {best_path}")
            return 0
        except BaseException as exc:  # noqa: BLE001 - report then decide
            if is_oom(exc) and i < len(ordered):
                print(f"\n[FAIL] CUDA out of memory at imgsz={cfg['imgsz']} batch={cfg['batch']}")
                print("[INFO] retrying with a lower-memory configuration...")
                try:
                    import torch as _t

                    _t.cuda.empty_cache()
                except Exception:
                    pass
                continue
            print(f"\n[FAIL] training aborted: {type(exc).__name__}: {exc}")
            if is_oom(exc):
                print("       Last low-VRAM fallback (imgsz=512 batch=1) also failed.")
                print("       Close other GPU apps, or try imgsz=416 with cache=ram.")
            return 1

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
