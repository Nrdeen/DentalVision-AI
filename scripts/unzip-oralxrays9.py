"""Unzip OralXrays-9 AES zip archives with the author password.

    python scripts/unzip-oralxrays9.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PASSWORD = b"CVPR2024-OralXrays-9"
RAW = ROOT / "data" / "oralxrays9-raw"
UNZIPPED = RAW / "unzipped"

ZIPS = ("annotations.zip", "train2017.zip", "val2017.zip")


def unzip_one(src: Path, dest: Path) -> None:
    try:
        import pyzipper
    except ImportError as exc:
        raise SystemExit(
            "[FATAL] pyzipper is required (AES zip). Install with: pip install pyzipper"
        ) from exc

    print(f"[INFO] extracting {src.name} -> {dest}")
    dest.mkdir(parents=True, exist_ok=True)
    with pyzipper.AESZipFile(src) as zf:
        zf.pwd = PASSWORD
        zf.extractall(dest)
    print(f"[OK]   {src.name}")


def already_extracted(name: str) -> bool:
    if name == "annotations.zip":
        return (UNZIPPED / "annotations" / "instances_train2017.json").is_file()
    stem = name.removesuffix(".zip")
    folder = UNZIPPED / stem
    if not folder.is_dir():
        return False
    return any(folder.iterdir())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    RAW.mkdir(parents=True, exist_ok=True)
    missing = [n for n in ZIPS if not (RAW / n).is_file()]
    if missing:
        print(f"[FATAL] still downloading: {', '.join(missing)}")
        print(f"        expected under {RAW}")
        return 2
    for name in ZIPS:
        if already_extracted(name) and not args.force:
            print(f"[SKIP] {name} already extracted")
            continue
        unzip_one(RAW / name, UNZIPPED)
    print(f"[OK] unzipped tree: {UNZIPPED}")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
