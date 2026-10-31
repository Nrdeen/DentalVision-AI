"""Train the panoramic caries specialist.

Starts GPU/CPU training as soon as it is invoked.

Picks a stack this machine can finish:
  8 GB+ CUDA -> YOLO11l-P2 / 768 / 150 epochs
  CPU or 2 GB GPU -> YOLO11n / 640 / 80 epochs (same family as implant)

    python scripts/train-caries-hires.py
    python scripts/train-caries-hires.py --resume
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from caries_hires import (  # noqa: E402
    FINETUNE_DEFAULTS,
    FINETUNE_HYP,
    OUT,
    SRC,
    TRAIN_HYP,
    build_detector,
    select_train_profile,
)

ROOT = Path(__file__).resolve().parent.parent
WEIGHT_DIR = ROOT / "models" / "xray" / "specialists"


def _helpers():
    import importlib.util

    path = Path(__file__).resolve().parent / "train-oralxrays-specialists.py"
    spec = importlib.util.spec_from_file_location("train_oralxrays_specialists", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.is_oom, mod.pin_yaml_dataset_root


def print_maps(label: str, metrics: object) -> None:
    box = getattr(metrics, "box", metrics)
    map50 = getattr(box, "map50", None)
    map5095 = getattr(box, "map", None)
    print(f"[METRICS] {label}")
    print(f"         mAP50     = {float(map50):.4f}" if map50 is not None else f"         mAP50     = {map50}")
    print(f"         mAP50-95  = {float(map5095):.4f}" if map5095 is not None else f"         mAP50-95  = {map5095}")
    print("         enable in the product only after YOUR val mAP50 >= 90")


def run_vals(yolo, data: Path, imgsz: int, pin_yaml_dataset_root, tta: bool) -> None:
    print("\n[INFO] val on lesion tiles (matches tiled inference, no TTA)")
    tile_metrics = yolo.val(data=str(data), imgsz=imgsz, split="val", plots=True, verbose=False, augment=False)
    print_maps("tiles / no TTA", tile_metrics)
    if tta:
        print("\n[INFO] val on lesion tiles with TTA")
        try:
            tta_metrics = yolo.val(data=str(data), imgsz=imgsz, split="val", plots=False, verbose=False, augment=True)
            print_maps("tiles / TTA", tta_metrics)
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] TTA val skipped: {exc}")

    full = SRC / "caries.yaml"
    if full.is_file() and (SRC / "valid" / "images").is_dir():
        try:
            full = pin_yaml_dataset_root(full)
            print("\n[INFO] extra val on full 1991x1127 films at imgsz=1280 (no tiles)")
            full_metrics = yolo.val(data=str(full), imgsz=1280, split="val", plots=False, verbose=False)
            print_maps("full panoramic val", full_metrics)
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] full-film val skipped: {exc}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--model", default="", help="override auto profile (e.g. yolo11n.pt)")
    ap.add_argument("--epochs", type=int, default=-1)
    ap.add_argument("--imgsz", type=int, default=-1)
    ap.add_argument("--batch", type=int, default=-1)
    ap.add_argument("--workers", type=int, default=-1)
    ap.add_argument("--device", default="0")
    ap.add_argument("--patience", type=int, default=-1)
    ap.add_argument("--skip-finetune", action="store_true")
    ap.add_argument("--force-heavy", action="store_true", help="YOLO11l-P2 even on CPU (will be extremely slow)")
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="print the chosen model/device and exit; does not train",
    )
    ap.add_argument(
        "--resume",
        action="store_true",
        help="continue the existing oralxrays-caries-hires run from last.pt (do not start over)",
    )
    args = ap.parse_args()

    is_oom, pin_yaml_dataset_root = _helpers()
    data = OUT / "caries.yaml"
    if not (OUT / "valid" / "images").is_dir() or not data.is_file():
        print(f"[FATAL] missing {OUT}")
        print("        prepare first: python scripts/prepare-caries-hires.py")
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

    from caries_hires import HEAVY_DEFAULTS, OOM_FALLBACKS_HEAVY

    profile = select_train_profile(args.device)
    if args.force_heavy:
        profile = dict(HEAVY_DEFAULTS)
        profile["device"] = "cpu" if not torch.cuda.is_available() else "0"
        profile["fallbacks"] = OOM_FALLBACKS_HEAVY
        profile["vram"] = 0.0
        profile["gpu"] = "forced"

    model = args.model or profile["model"]
    epochs = profile["epochs"] if args.epochs < 0 else args.epochs
    imgsz = profile["imgsz"] if args.imgsz < 0 else args.imgsz
    batch = profile["batch"] if args.batch < 0 else args.batch
    workers = profile["workers"] if args.workers < 0 else args.workers
    patience = profile["patience"] if args.patience < 0 else args.patience
    device = profile["device"]
    skip_ft = True if args.skip_finetune else bool(profile.get("skip_finetune", True))
    fallbacks_src = profile.get("fallbacks") or ()

    print("[INFO] if a YOLO11l-P2 run is still going, stop it with Ctrl+C.")
    print("       that stack is ~9 h/epoch on CPU; this profile replaces it.")
    print(f"[INFO] device={device} gpu={profile.get('gpu')} vram={profile.get('vram', 0):.1f} GB")
    print(f"[INFO] model={model} imgsz={imgsz} batch={batch} epochs={epochs} workers={workers}")
    if device == "cpu":
        print("[INFO] CPU profile (same class as implant): expect ~30-60 min/epoch, ~80 epochs")
        print("       ~1-2 nights, not weeks. mAP50-95 will be lower than the 11l-P2 target.")
    last_ckpt = ROOT / "runs" / "xray-oralxrays" / "oralxrays-caries-hires" / "weights" / "last.pt"
    if args.dry_run:
        print("[DRY-RUN] no training started")
        if args.resume:
            if not last_ckpt.is_file():
                print(f"[DRY-RUN] BLOCK: missing {last_ckpt}")
                return 2
            print(f"[DRY-RUN] OK to resume with: python scripts/train-caries-hires.py --resume")
            print(f"          checkpoint={last_ckpt}")
            return 0
        if "yolo11l" in str(model) or "p2" in str(model).lower():
            if device == "cpu" or float(profile.get("vram") or 0) < 8:
                print("[DRY-RUN] BLOCK: this is the slow stack. Do not train.")
                return 2
        print("[DRY-RUN] OK to train with: python scripts/train-caries-hires.py")
        return 0

    if args.resume:
        if not last_ckpt.is_file():
            print(f"[FATAL] cannot resume — missing {last_ckpt}")
            return 2
        print(f"[INFO] resuming from {last_ckpt}")
        print("       do not run without --resume; that would start epoch 1 again.")
        try:
            yolo = YOLO(str(last_ckpt))
            yolo.train(resume=True)
        except BaseException as exc:  # noqa: BLE001
            print(f"[FAIL] resume: {type(exc).__name__}: {exc}")
            return 1
        best = ROOT / "runs" / "xray-oralxrays" / "oralxrays-caries-hires" / "weights" / "best.pt"
        if best.is_file():
            WEIGHT_DIR.mkdir(parents=True, exist_ok=True)
            dest = WEIGHT_DIR / "caries.pt"
            dest.write_bytes(best.read_bytes())
            print(f"[OK] copied {best} -> {dest}")
            yolo = YOLO(str(best))
            run_vals(yolo, data, imgsz, pin_yaml_dataset_root, tta=False)
        print("\n[OK] resumed run finished — class still gated off")
        print("     do not set ENABLED xray-caries true until YOUR tile val mAP50 >= 90")
        return 0

    fallbacks = []
    seen: set[tuple[str, int, int]] = set()
    first = {"model": model, "imgsz": imgsz, "batch": batch}
    for cfg in (first, *fallbacks_src):
        key = (cfg["model"], int(cfg["imgsz"]), int(cfg["batch"]))
        if key in seen:
            continue
        seen.add(key)
        fallbacks.append(cfg)

    out_name = "oralxrays-caries-hires"
    ft_name = "oralxrays-caries-hires-ft"
    project = ROOT / "runs" / "xray-oralxrays"
    best: Path | None = None
    used_imgsz = imgsz

    for i, cfg in enumerate(fallbacks, start=1):
        print("\n" + "=" * 60)
        print(
            f"[INFO] detect phase {i}/{len(fallbacks)} "
            f"model={cfg['model']} imgsz={cfg['imgsz']} batch={cfg['batch']}"
        )
        print("=" * 60)
        try:
            yolo = build_detector(cfg["model"])
            yolo.train(
                data=str(data),
                epochs=epochs,
                imgsz=cfg["imgsz"],
                batch=cfg["batch"],
                device=device,
                workers=workers,
                patience=patience,
                project=str(project),
                name=out_name,
                exist_ok=True,
                **TRAIN_HYP,
            )
            cand = project / out_name / "weights" / "best.pt"
            if cand.is_file():
                best = cand
                used_imgsz = int(cfg["imgsz"])
            break
        except BaseException as exc:  # noqa: BLE001
            if is_oom(exc) and i < len(fallbacks):
                print(f"[FAIL] CUDA OOM at {cfg}")
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass
                continue
            print(f"[FAIL] caries: {type(exc).__name__}: {exc}")
            return 1
    else:
        return 1

    if best is None or not best.is_file():
        print("[FAIL] training finished without best.pt")
        return 1

    if not skip_ft:
        print("\n" + "=" * 60)
        print("[INFO] localization finetune: mosaic off, low lr")
        print("=" * 60)
        try:
            yolo = YOLO(str(best))
            yolo.train(
                data=str(data),
                epochs=FINETUNE_DEFAULTS["epochs"],
                imgsz=used_imgsz,
                batch=batch,
                device=device,
                workers=workers,
                patience=FINETUNE_DEFAULTS["patience"],
                project=str(project),
                name=ft_name,
                exist_ok=True,
                **FINETUNE_HYP,
            )
            ft_best = project / ft_name / "weights" / "best.pt"
            if ft_best.is_file():
                best = ft_best
        except BaseException as exc:  # noqa: BLE001
            if is_oom(exc):
                print("[WARN] finetune OOM — keeping detect-phase weights")
                try:
                    torch.cuda.empty_cache()
                except Exception:
                    pass
            else:
                print(f"[WARN] finetune skipped: {type(exc).__name__}: {exc}")

    WEIGHT_DIR.mkdir(parents=True, exist_ok=True)
    dest = WEIGHT_DIR / "caries.pt"
    dest.write_bytes(best.read_bytes())
    print(f"[OK] copied {best} -> {dest}")

    yolo = YOLO(str(best))
    run_vals(yolo, data, used_imgsz, pin_yaml_dataset_root, tta=not skip_ft)

    print("\n[OK] caries run finished — class still gated off")
    print("     do not set ENABLED xray-caries true until YOUR tile val mAP50 >= 90")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
