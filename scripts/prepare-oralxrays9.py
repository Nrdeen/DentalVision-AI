"""Download-complete pipeline: unzip -> YOLO convert -> specialist split.

Does NOT launch training. After this prints READY, wait for the user to say
they want training to start.

    python scripts/prepare-oralxrays9.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable


def run(script: str) -> int:
    print("\n" + "=" * 60)
    print(f"[INFO] {script}")
    print("=" * 60)
    return subprocess.call([PY, str(ROOT / "scripts" / script)], cwd=str(ROOT))


def main() -> int:
    for script in (
        "unzip-oralxrays9.py",
        "convert-oralxrays9-to-yolo.py",
        "split-oralxrays-specialists.py",
    ):
        code = run(script)
        if code != 0:
            print(f"[FATAL] {script} exited {code}")
            return code
    print("\n" + "=" * 60)
    print("READY FOR TRAINING — not started.")
    print("When you want it: python scripts/train-oralxrays-specialists.py")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
