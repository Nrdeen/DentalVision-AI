"""Split OralXrays-9 YOLO into specialist subsets.

Next train queue: caries (Decay), periapical (Apical Periodontitis).
Enable in the product only after your own val mAP50 >= 90.

    python scripts/split-oralxrays-specialists.py
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_SPLITTER = Path(__file__).resolve().parent / "split-toothtruth-specialists.py"
_spec = importlib.util.spec_from_file_location("split_toothtruth_specialists", _SPLITTER)
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)

SPECIALISTS = _mod.SPECIALISTS
copy_split = _mod.copy_split
load_names = _mod.load_names
write_yaml = _mod.write_yaml

TRAINABLE = ("caries", "periapical", "implant", "restorations", "missing", "impaction")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default=str(ROOT / "data" / "oralxrays9-yolo"))
    ap.add_argument("--out", default=str(ROOT / "data" / "xray" / "specialists" / "oralxrays"))
    args = ap.parse_args()
    src = Path(args.src)
    if not src.is_absolute():
        src = ROOT / src
    data_yaml = src / "data.yaml"
    if not data_yaml.is_file():
        print(f"[FATAL] missing {data_yaml}")
        print("        convert first: python scripts/convert-oralxrays9-to-yolo.py")
        return 2
    names = load_names(data_yaml)
    out_root = Path(args.out)
    if not out_root.is_absolute():
        out_root = ROOT / out_root
    out_root.mkdir(parents=True, exist_ok=True)

    print("[INFO] OralXrays-9 specialist split")
    print(f"       specialists: {', '.join(TRAINABLE)}")

    for spec in TRAINABLE:
        cfg = SPECIALISTS[spec]
        dest = out_root / spec
        print(f"\n[INFO] specialist={spec} keys={sorted(cfg['keys'])}")
        total = 0
        for split in ("train", "valid", "test"):
            n = copy_split(src, dest, names, cfg["keys"], split)
            print(f"       {split}: {n} images")
            total += n
        write_yaml(dest, names, cfg["keys"], cfg["yaml"])
        print(f"       total={total} -> {dest / cfg['yaml']}")
    print("\n[OK] specialists ready. Do not start training until you say so.")
    print("     launcher (later): python scripts/train-oralxrays-specialists.py")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
