"""Shared geometry for the high-res panoramic caries specialist.

OralXrays Decay films are 1991x1127 with ~78 px median lesions. Training at
imgsz=640 shrinks those lesions to ~25 px. This module:

- applies the same CLAHE as clinic ingest (do not CLAHE twice)
- cuts lesion-preserving 768 tiles (lesion ~10% of the tile, not ~4% of the film)
- extra P2 head + localization finetune live in the train launcher
- cuts overlapping 768 windows at inference and merges with NMS

Does not launch training.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable

import numpy as np

TILE = 768
OVERLAP = 192
MARGIN = 80
TRAIN_JITTER = 32
KEEP_IOA = 0.75
NMS_IOU = 0.5
JPEG_QUALITY = 95

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "xray" / "specialists" / "oralxrays" / "caries"
OUT = ROOT / "data" / "xray" / "specialists" / "oralxrays" / "caries-hires"

# Heavy stack: only when CUDA VRAM is enough. CPU / MX330 use the fast profile.
TRAIN_DEFAULTS = {
    "model": "yolo11n.pt",
    "imgsz": 640,
    "batch": 2,
    "epochs": 80,
    "patience": 15,
    "workers": 2,
    "skip_finetune": True,
}

HEAVY_DEFAULTS = {
    "model": "yolo11l-p2",
    "imgsz": TILE,
    "batch": 2,
    "epochs": 150,
    "patience": 30,
    "workers": 2,
    "skip_finetune": False,
}

# Localization-heavy: high-IoU (mAP50-95) needs tight boxes more than recall.
TRAIN_HYP = {
    "copy_paste": 0.25,
    "close_mosaic": 40,
    "mixup": 0.0,
    "mosaic": 0.8,
    "hsv_h": 0.0,
    "hsv_s": 0.1,
    "hsv_v": 0.15,
    "degrees": 2.0,
    "translate": 0.05,
    "scale": 0.15,
    "fliplr": 0.5,
    "flipud": 0.0,
    "erasing": 0.0,
    "shear": 0.0,
    "perspective": 0.0,
    "cos_lr": True,
    "warmup_epochs": 5.0,
    "optimizer": "AdamW",
    "lr0": 0.001,
    "lrf": 0.01,
    "box": 12.0,
    "cls": 0.3,
    "dfl": 1.75,
    "single_cls": True,
    "seed": 0,
    "plots": True,
    "amp": True,
    "cache": False,
}

FINETUNE_DEFAULTS = {
    "epochs": 40,
    "patience": 12,
}

FINETUNE_HYP = {
    **TRAIN_HYP,
    "mosaic": 0.0,
    "copy_paste": 0.0,
    "mixup": 0.0,
    "close_mosaic": 0,
    "lr0": 0.0002,
    "warmup_epochs": 1.0,
    "scale": 0.08,
    "translate": 0.03,
    "degrees": 1.0,
}

OOM_FALLBACKS_HEAVY = (
    {"model": "yolo11l-p2", "imgsz": TILE, "batch": 2},
    {"model": "yolo11l-p2", "imgsz": TILE, "batch": 1},
    {"model": "yolo11m-p2", "imgsz": TILE, "batch": 2},
    {"model": "yolo11l.pt", "imgsz": TILE, "batch": 2},
    {"model": "yolo11m.pt", "imgsz": TILE, "batch": 2},
    {"model": "yolo11m.pt", "imgsz": TILE, "batch": 1},
)

OOM_FALLBACKS_FAST = (
    {"model": "yolo11n.pt", "imgsz": 640, "batch": 2},
    {"model": "yolo11n.pt", "imgsz": 640, "batch": 1},
    {"model": "yolo11n.pt", "imgsz": 512, "batch": 1},
)

# Back-compat name used by older launcher copies.
OOM_FALLBACKS = OOM_FALLBACKS_FAST


def select_train_profile(requested_device: str = "0") -> dict:
    """Pick a stack this machine can finish. CPU / 2GB GPU must not run YOLO11l-P2."""
    import torch

    want_cuda = requested_device != "cpu"
    cuda = bool(want_cuda and torch.cuda.is_available())
    vram = 0.0
    gpu_name = "cpu"
    if cuda:
        props = torch.cuda.get_device_properties(0)
        vram = props.total_memory / 1024**3
        gpu_name = torch.cuda.get_device_name(0)

    if cuda and vram >= 8.0:
        cfg = dict(HEAVY_DEFAULTS)
        cfg.update(device="0", fallbacks=OOM_FALLBACKS_HEAVY, vram=vram, gpu=gpu_name)
        return cfg

    batch = 2
    if cuda and vram < 2.5:
        batch = 1
    cfg = dict(TRAIN_DEFAULTS)
    cfg["batch"] = batch
    cfg["workers"] = 0 if not cuda else 2
    cfg["device"] = "0" if cuda else "cpu"
    cfg["fallbacks"] = (
        {"model": "yolo11n.pt", "imgsz": 640, "batch": batch},
        {"model": "yolo11n.pt", "imgsz": 640, "batch": 1},
        {"model": "yolo11n.pt", "imgsz": 512, "batch": 1},
    )
    cfg["skip_finetune"] = True
    cfg["vram"] = vram
    cfg["gpu"] = gpu_name
    return cfg

P2_YAML = ROOT / "models" / "xray" / "yolo11-p2.yaml"


def _p2_scale(model: str) -> str:
    for scale in ("x", "l", "m", "s", "n"):
        if f"yolo11{scale}" in model.replace(".pt", ""):
            return scale
    return "l"


def build_detector(model: str):
    """Load YOLO11, with a P2 head when the name contains '-p2'."""
    from ultralytics import YOLO

    if "-p2" not in model:
        return YOLO(model if model.endswith(".pt") else f"{model}.pt")
    scale = _p2_scale(model)
    if not P2_YAML.is_file():
        raise FileNotFoundError(P2_YAML)
    alias = P2_YAML.with_name(f"yolo11{scale}-p2.yaml")
    alias.write_text(P2_YAML.read_text(encoding="utf-8"), encoding="utf-8")
    return YOLO(str(alias)).load(f"yolo11{scale}.pt")


def clahe_rgb(arr: np.ndarray) -> np.ndarray:
    from xray_clinic_ingest import _clahe_rgb

    return _clahe_rgb(arr)


def yolo_to_xyxy(xc: float, yc: float, w: float, h: float, img_w: int, img_h: int) -> tuple[float, float, float, float]:
    bw = w * img_w
    bh = h * img_h
    cx = xc * img_w
    cy = yc * img_h
    x1 = cx - bw / 2
    y1 = cy - bh / 2
    return x1, y1, x1 + bw, y1 + bh


def xyxy_to_yolo(x1: float, y1: float, x2: float, y2: float, img_w: int, img_h: int) -> tuple[float, float, float, float] | None:
    if img_w <= 0 or img_h <= 0:
        return None
    bw = x2 - x1
    bh = y2 - y1
    if bw <= 1 or bh <= 1:
        return None
    xc = (x1 + x2) / 2 / img_w
    yc = (y1 + y2) / 2 / img_h
    nw = bw / img_w
    nh = bh / img_h
    xc = min(max(xc, 0.0), 1.0)
    yc = min(max(yc, 0.0), 1.0)
    nw = min(max(nw, 1e-6), 1.0)
    nh = min(max(nh, 1e-6), 1.0)
    return xc, yc, nw, nh


def parse_yolo_label(text: str, img_w: int, img_h: int) -> list[tuple[float, float, float, float]]:
    boxes: list[tuple[float, float, float, float]] = []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        xc, yc, w, h = (float(v) for v in parts[1:5])
        boxes.append(yolo_to_xyxy(xc, yc, w, h, img_w, img_h))
    return boxes


def box_ioa(inner: tuple[float, float, float, float], crop: tuple[float, float, float, float]) -> float:
    ix1, iy1, ix2, iy2 = inner
    cx1, cy1, cx2, cy2 = crop
    area = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    if area <= 0:
        return 0.0
    x1 = max(ix1, cx1)
    y1 = max(iy1, cy1)
    x2 = min(ix2, cx2)
    y2 = min(iy2, cy2)
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    return inter / area


def iou_xyxy(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    x1 = max(ax1, bx1)
    y1 = max(ay1, by1)
    x2 = min(ax2, bx2)
    y2 = min(ay2, by2)
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    denom = area_a + area_b - inter
    return inter / denom if denom > 0 else 0.0


def lesion_window(
    img_w: int,
    img_h: int,
    box: tuple[float, float, float, float],
    tile: int = TILE,
    jitter: int = 0,
    rng: np.random.Generator | None = None,
) -> tuple[int, int, int]:
    x1, y1, x2, y2 = box
    bw = max(1.0, x2 - x1)
    bh = max(1.0, y2 - y1)
    side = int(max(tile, bw + 2 * MARGIN, bh + 2 * MARGIN))
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    if jitter > 0 and rng is not None:
        cx += float(rng.integers(-jitter, jitter + 1))
        cy += float(rng.integers(-jitter, jitter + 1))
    x0 = int(round(cx - side / 2))
    y0 = int(round(cy - side / 2))
    if img_w <= side:
        x0 = (img_w - side) // 2
    else:
        x0 = min(max(x0, 0), img_w - side)
    if img_h <= side:
        y0 = (img_h - side) // 2
    else:
        y0 = min(max(y0, 0), img_h - side)
    return x0, y0, side


def sliding_windows(img_w: int, img_h: int, tile: int = TILE, overlap: int = OVERLAP) -> list[tuple[int, int, int]]:
    step = max(1, tile - overlap)
    xs = list(range(0, max(1, img_w - tile + 1), step))
    ys = list(range(0, max(1, img_h - tile + 1), step))
    if not xs or xs[-1] != max(0, img_w - tile):
        xs.append(max(0, img_w - tile))
    if not ys or ys[-1] != max(0, img_h - tile):
        ys.append(max(0, img_h - tile))
    if img_w <= tile:
        xs = [(img_w - tile) // 2]
    if img_h <= tile:
        ys = [(img_h - tile) // 2]
    seen: set[tuple[int, int]] = set()
    out: list[tuple[int, int, int]] = []
    for y0 in ys:
        for x0 in xs:
            key = (x0, y0)
            if key in seen:
                continue
            seen.add(key)
            out.append((x0, y0, tile))
    return out or [(0, 0, tile)]


def crop_tile(rgb: np.ndarray, x0: int, y0: int, side: int) -> np.ndarray:
    h, w = rgb.shape[:2]
    pad_top = max(0, -y0)
    pad_left = max(0, -x0)
    pad_bottom = max(0, y0 + side - h)
    pad_right = max(0, x0 + side - w)
    if pad_top or pad_left or pad_bottom or pad_right:
        rgb = np.pad(rgb, ((pad_top, pad_bottom), (pad_left, pad_right), (0, 0)), mode="edge")
        x0 += pad_left
        y0 += pad_top
    return np.ascontiguousarray(rgb[y0 : y0 + side, x0 : x0 + side])


def shift_boxes(
    boxes: Iterable[tuple[float, float, float, float]],
    x0: int,
    y0: int,
    side: int,
    min_ioa: float = KEEP_IOA,
) -> list[tuple[float, float, float, float]]:
    crop = (float(x0), float(y0), float(x0 + side), float(y0 + side))
    kept: list[tuple[float, float, float, float]] = []
    for box in boxes:
        if box_ioa(box, crop) < min_ioa:
            continue
        x1, y1, x2, y2 = box
        x1 = min(max(x1 - x0, 0.0), float(side))
        y1 = min(max(y1 - y0, 0.0), float(side))
        x2 = min(max(x2 - x0, 0.0), float(side))
        y2 = min(max(y2 - y0, 0.0), float(side))
        if x2 - x1 < 2 or y2 - y1 < 2:
            continue
        kept.append((x1, y1, x2, y2))
    return kept


def boxes_to_yolo_lines(boxes: list[tuple[float, float, float, float]], side: int) -> str:
    lines: list[str] = []
    for box in boxes:
        yolo = xyxy_to_yolo(*box, side, side)
        if yolo is None:
            continue
        xc, yc, w, h = yolo
        lines.append(f"0 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
    return "\n".join(lines) + ("\n" if lines else "")


def nms(boxes: np.ndarray, scores: np.ndarray, iou_thr: float = NMS_IOU) -> list[int]:
    if boxes.size == 0:
        return []
    order = scores.argsort()[::-1]
    keep: list[int] = []
    while order.size:
        i = int(order[0])
        keep.append(i)
        if order.size == 1:
            break
        rest = order[1:]
        ious = np.array([iou_xyxy(tuple(boxes[i]), tuple(boxes[j])) for j in rest], dtype=np.float32)
        order = rest[ious < iou_thr]
    return keep


def windows_cover_boxes(
    img_w: int,
    img_h: int,
    boxes: list[tuple[float, float, float, float]],
    tile: int = TILE,
) -> list[tuple[int, int, int]]:
    """Greedy val cover: each lesion in exactly one tile when possible."""
    remaining = list(range(len(boxes)))
    windows: list[tuple[int, int, int]] = []
    while remaining:
        idx = remaining[0]
        x0, y0, side = lesion_window(img_w, img_h, boxes[idx], tile=tile, jitter=0)
        crop = (float(x0), float(y0), float(x0 + side), float(y0 + side))
        covered = [i for i in remaining if box_ioa(boxes[i], crop) >= KEEP_IOA]
        if not covered:
            covered = [idx]
        remaining = [i for i in remaining if i not in covered]
        windows.append((x0, y0, side))
    return windows


def merge_tile_detections(
    tile_dets: list[dict[str, Any]],
    img_w: int,
    img_h: int,
) -> list[dict[str, Any]]:
    if not tile_dets:
        return []
    abs_boxes = []
    scores = []
    for det in tile_dets:
        x0, y0, side = det["window"]
        x1, y1, x2, y2 = det["xyxyn"]
        abs_boxes.append(
            (
                (x1 * side + x0),
                (y1 * side + y0),
                (x2 * side + x0),
                (y2 * side + y0),
            )
        )
        scores.append(float(det["conf"]))
    boxes_arr = np.array(abs_boxes, dtype=np.float32)
    keep = nms(boxes_arr, np.array(scores, dtype=np.float32), NMS_IOU)
    merged: list[dict[str, Any]] = []
    for i in keep:
        x1, y1, x2, y2 = (float(v) for v in boxes_arr[i])
        det = dict(tile_dets[i])
        det.pop("window", None)
        det["xyxyn"] = [
            max(0.0, min(1.0, x1 / img_w)),
            max(0.0, min(1.0, y1 / img_h)),
            max(0.0, min(1.0, x2 / img_w)),
            max(0.0, min(1.0, y2 / img_h)),
        ]
        merged.append(det)
    return merged


def self_test() -> None:
    img_w, img_h = 1991, 1127
    box = (900.0, 500.0, 980.0, 580.0)
    x0, y0, side = lesion_window(img_w, img_h, box, tile=TILE, jitter=0)
    assert side == TILE, side
    shifted = shift_boxes([box], x0, y0, side)
    assert len(shifted) == 1, shifted
    sx1, sy1, sx2, sy2 = shifted[0]
    assert 0 <= sx1 < sx2 <= side
    assert 0 <= sy1 < sy2 <= side
    yolo = xyxy_to_yolo(sx1, sy1, sx2, sy2, side, side)
    assert yolo is not None
    back = yolo_to_xyxy(*yolo, side, side)
    assert abs(back[0] - sx1) < 1.5
    wins = sliding_windows(img_w, img_h, TILE, OVERLAP)
    assert len(wins) >= 2
    xs = {w[0] for w in wins}
    assert min(xs) <= 0
    assert max(xs) + TILE >= img_w - 1
    rgb = np.zeros((img_h, img_w, 3), dtype=np.uint8)
    rgb[500:580, 900:980] = 200
    tile = crop_tile(rgb, x0, y0, side)
    assert tile.shape == (side, side, 3)
    a = (0.0, 0.0, 10.0, 10.0)
    b = (1.0, 1.0, 11.0, 11.0)
    assert 0.6 < iou_xyxy(a, b) < 0.75
    keep = nms(np.array([a, b], dtype=np.float32), np.array([0.9, 0.4], dtype=np.float32), 0.5)
    assert keep == [0]


if __name__ == "__main__":
    self_test()
    print("[OK] caries_hires self-test passed")
