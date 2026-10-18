"""Local YOLO inference for DentaAI panoramic X-rays.

Serves a loopback HTTP API so the web app can analyse each uploaded image
against the latest `best.pt` weights (not demo boxes).

    python scripts/infer-xray.py --serve
    python scripts/infer-xray.py --image path/to/scan.jpg
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

for _stream in ("stdout", "stderr"):
    try:
        getattr(sys, _stream).reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parent.parent
MAX_BODY = 25 * 1024 * 1024
_MODELS: dict[str, Any] = {}
_WEIGHTS: Path | None = None

sys.path.insert(0, str(Path(__file__).resolve().parent))
from xray_taxonomy import SPECIALIST_WEIGHTS, route_class, should_emit  # noqa: E402


def resolve_weights() -> Path:
    env = os.environ.get("XRAY_WEIGHTS")
    if env:
        p = Path(env)
        if not p.is_absolute():
            p = ROOT / p
        if p.is_file():
            return p
        raise FileNotFoundError(f"XRAY_WEIGHTS not found: {p}")

    pinned = ROOT / "models" / "xray" / "best.pt"
    if pinned.is_file():
        return pinned

    runs = ROOT / "runs"
    found: list[Path] = []
    if runs.is_dir():
        found = sorted(runs.rglob("best.pt"), key=lambda p: p.stat().st_mtime, reverse=True)
    if found:
        return found[0]
    raise FileNotFoundError(
        "No best.pt weights found. Train first (python scripts/train-yolo.py) "
        "or set XRAY_WEIGHTS to the checkpoint path."
    )


def load_models() -> dict[str, Any]:
    global _MODELS, _WEIGHTS
    if _MODELS:
        return _MODELS
    try:
        import torch
        from ultralytics import YOLO
    except ImportError as exc:
        raise RuntimeError(f"missing dependency: {exc}") from exc

    device = "0" if torch.cuda.is_available() else "cpu"
    specialists = {
        sid: path for sid, path in SPECIALIST_WEIGHTS.items() if path.is_file()
    }
    if specialists:
        print(f"[INFO] loading {len(specialists)} specialist weights on device={device}", flush=True)
        for sid, path in specialists.items():
            print(f"[INFO]   {sid}: {path}", flush=True)
            model = YOLO(str(path))
            try:
                model.to(device)
            except Exception:
                pass
            _MODELS[sid] = model
        _WEIGHTS = next(iter(specialists.values()))
        return _MODELS

    _WEIGHTS = resolve_weights()
    print(f"[INFO] no specialist checkpoints yet; loading {_WEIGHTS} on device={device}", flush=True)
    model = YOLO(str(_WEIGHTS))
    try:
        model.to(device)
    except Exception:
        pass
    _MODELS["legacy"] = model
    return _MODELS


def load_model():
    models = load_models()
    return next(iter(models.values()))


def decode_image(image: str) -> Any:
    import numpy as np
    from PIL import Image

    raw: bytes
    if image.startswith("data:"):
        _, _, b64 = image.partition(",")
        raw = base64.b64decode(b64)
    else:
        path = Path(image)
        if not path.is_absolute():
            path = ROOT / image.lstrip("/")
        public = ROOT / "public" / image.lstrip("/")
        if public.is_file():
            path = public
        if not path.is_file():
            raise FileNotFoundError(f"image not found: {image}")
        raw = path.read_bytes()

    img = Image.open(BytesIO(raw)).convert("RGB")
    return np.array(img)


def _collect(model: Any, arr: Any, conf: float) -> list[dict[str, Any]]:
    detections: list[dict[str, Any]] = []
    results = model.predict(source=arr, imgsz=640, conf=conf, verbose=False)
    if not results:
        return detections
    r0 = results[0]
    names = r0.names if isinstance(r0.names, dict) else {i: n for i, n in enumerate(r0.names)}
    boxes = r0.boxes
    if boxes is None or len(boxes) == 0:
        return detections
    xyxyn = boxes.xyxyn.cpu().numpy()
    confs = boxes.conf.cpu().numpy()
    clss = boxes.cls.cpu().numpy()
    for i in range(len(boxes)):
        cls_id = int(clss[i])
        x1, y1, x2, y2 = (float(v) for v in xyxyn[i])
        name = str(names.get(cls_id, cls_id))
        score = float(confs[i])
        routed = route_class(cls_id, name)
        detections.append(
            {
                "cls": cls_id,
                "name": name,
                "key": routed.key,
                "specialist": routed.specialist,
                "policy": routed.policy,
                "conf": score,
                "xyxyn": [
                    max(0.0, min(1.0, x1)),
                    max(0.0, min(1.0, y1)),
                    max(0.0, min(1.0, x2)),
                    max(0.0, min(1.0, y2)),
                ],
            }
        )
    return detections


def predict(image: str, conf: float = 0.15) -> dict[str, Any]:
    models = load_models()
    arr = decode_image(image)
    detections: list[dict[str, Any]] = []
    for model in models.values():
        detections.extend(_collect(model, arr, conf))
    kept = [d for d in detections if should_emit(route_class(d["cls"], d["name"]), d["conf"], conf)]
    return {
        "ok": True,
        "weights": str(_WEIGHTS) if _WEIGHTS else None,
        "specialists": list(models.keys()),
        "rawCount": len(detections),
        "count": len(kept),
        "detections": kept,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "DentaAI-XrayInfer/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        sys.stderr.write("[infer] " + (fmt % args) + "\n")

    def _send(self, code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/health", "/"):
            try:
                load_model()
                self._send(
                    200,
                    {"ok": True, "weights": str(_WEIGHTS) if _WEIGHTS else None},
                )
            except Exception as exc:  # noqa: BLE001
                self._send(503, {"ok": False, "error": str(exc)})
            return
        self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path not in ("/predict", "/"):
            self._send(404, {"ok": False, "error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            self._send(413, {"ok": False, "error": "invalid or too large body"})
            return
        try:
            raw = self.rfile.read(length)
            data = json.loads(raw.decode("utf-8"))
            image = data.get("image")
            if not isinstance(image, str) or not image.strip():
                raise ValueError("missing image")
            conf = float(data.get("conf") or 0.15)
            self._send(200, predict(image, conf=conf))
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"ok": False, "error": str(exc)})


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--serve", action="store_true")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--image", default="")
    ap.add_argument("--conf", type=float, default=0.15)
    args = ap.parse_args()

    if args.serve:
        try:
            load_model()
        except Exception as exc:  # noqa: BLE001
            print(f"[FATAL] {exc}", file=sys.stderr)
            return 2
        httpd = ThreadingHTTPServer((args.host, args.port), Handler)
        print(f"[OK] xray infer listening on http://{args.host}:{args.port}", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[INFO] stopped")
        return 0

    image = args.image
    if not image:
        payload = json.loads(sys.stdin.read() or "{}")
        image = payload.get("image") or ""
        if not image:
            print("[FATAL] pass --image or JSON {image} on stdin", file=sys.stderr)
            return 2
    try:
        print(json.dumps(predict(image, conf=args.conf), ensure_ascii=False))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
