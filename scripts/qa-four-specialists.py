"""One-off QA: run the live ensemble on four specialist validation films."""

from __future__ import annotations

import importlib.util
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("infer_xray", ROOT / "scripts" / "infer-xray.py")
assert SPEC and SPEC.loader
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)

IMAGES = [
    ROOT / "public" / "samples" / "qa-impaction.jpg",
    ROOT / "public" / "samples" / "qa-implant.jpg",
    ROOT / "public" / "samples" / "qa-restorations.jpg",
    ROOT / "public" / "samples" / "qa-missing.jpg",
    ROOT / "public" / "samples" / "xray.jpg",
    ROOT / "public" / "samples" / "implant.jpg",
]


def main() -> int:
    for img in IMAGES:
        print("========", img.name, "========", flush=True)
        out = MOD.predict(str(img), conf=0.15)
        q = out.get("quality") or {}
        print("quality", q.get("level"), q.get("flags"), "count", out.get("count"), "raw", out.get("rawCount"))
        counts = Counter((d.get("key"), d.get("name"), d.get("specialist")) for d in out.get("detections") or [])
        for item, n in counts.most_common():
            print(f"  {n:3d}  key={item[0]}  name={item[1]}  spec={item[2]}")
        top = sorted(out.get("detections") or [], key=lambda d: -d["conf"])[:5]
        for d in top:
            print(f"    conf={d['conf']:.3f} {d['key']} ({d['name']})")
        print(flush=True)

    extra = ROOT / "data" / "xray" / "specialists" / "oralxrays" / "missing" / "valid" / "images"
    for stem in ("025285", "025335"):
        hits = list(extra.glob(f"{stem}.*"))
        if not hits:
            continue
        print("======== extra missing", hits[0].name, "========", flush=True)
        out = MOD.predict(str(hits[0]), conf=0.15)
        counts = Counter((d.get("key"), d.get("name")) for d in out.get("detections") or [])
        print("count", out.get("count"), dict(counts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
