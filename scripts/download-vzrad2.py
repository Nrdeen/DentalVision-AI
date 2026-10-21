"""Download vzrad2 dataset from Roboflow in YOLO format.

This script downloads the vzrad2 dataset (10,580 panoramic dental X-rays)
from Roboflow and prepares it for YOLO training.

Requirements:
    pip install roboflow

Usage:
    python scripts/download-vzrad2.py --api-key YOUR_ROBOFLOW_API_KEY

The dataset will be downloaded to: data/vzrad2/
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "data" / "vzrad2"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--api-key",
        required=True,
        help="Your Roboflow API key (get it from https://app.roboflow.com)",
    )
    ap.add_argument(
        "--workspace",
        default="arshs-workspace-radio",
        help="Roboflow workspace name",
    )
    ap.add_argument(
        "--project",
        default="vzrad2",
        help="Roboflow project name",
    )
    ap.add_argument(
        "--version",
        default="1",
        help="Dataset version",
    )
    args = ap.parse_args()

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[INFO] Output directory: {OUTPUT_DIR}")

    try:
        from roboflow import Roboflow
    except ImportError as exc:
        print(f"[FATAL] missing dependency: {exc}")
        print("        install with:  pip install roboflow")
        return 2

    print(f"[INFO] Connecting to Roboflow...")
    rf = Roboflow(api_key=args.api_key)

    print(f"[INFO] Accessing project: {args.workspace}/{args.project}")
    try:
        project = rf.workspace(args.workspace).project(args.project)
    except Exception as exc:
        print(f"[FATAL] Failed to access project: {exc}")
        print("        Check your API key and workspace/project names")
        return 2

    print(f"[INFO] Downloading version {args.version} in YOLO format...")
    try:
        dataset = project.version(args.version)
        dataset.download("yolov8", location=str(OUTPUT_DIR))
    except Exception as exc:
        print(f"[FATAL] Failed to download dataset: {exc}")
        return 2

    print(f"\n[OK] Dataset downloaded successfully to: {OUTPUT_DIR}")
    print(f"[INFO] Next steps:")
    print(f"       1. Review the dataset structure in {OUTPUT_DIR}")
    print(f"       2. Update data/xray/data.yaml with the new classes")
    print(f"       3. Run training with: python scripts/train-yolo.py --data data/vzrad2/data.yaml")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
