"""Prepare clinic panoramics before YOLO so device / JPEG shift hurts less.

Does not retrain. Boxes are mapped back to the original image so overlays stay aligned.
"""

from __future__ import annotations

from typing import Any

import numpy as np

# Extra confidence demanded when the film is a phone photo / WhatsApp JPEG.
BOOST_POOR = {
    "xray-impaction": 0.04,
    "xray-implant": 0.04,
    "xray-restorations": 0.10,
    "xray-missing": 0.05,
    "xray-caries": 0.06,
}
BOOST_FAIR = {k: v * 0.5 for k, v in BOOST_POOR.items()}


def _gray(arr: np.ndarray) -> np.ndarray:
    if arr.ndim == 2:
        return arr.astype(np.float32)
    rgb = arr[..., :3].astype(np.float32)
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def _laplacian_var(gray: np.ndarray) -> float:
    g = gray.astype(np.float32)
    if max(g.shape) > 640:
        scale = 640 / max(g.shape)
        h = max(8, int(g.shape[0] * scale))
        w = max(8, int(g.shape[1] * scale))
        try:
            import cv2

            g = cv2.resize(g, (w, h), interpolation=cv2.INTER_AREA)
        except ImportError:
            ys = np.linspace(0, g.shape[0] - 1, h).astype(int)
            xs = np.linspace(0, g.shape[1] - 1, w).astype(int)
            g = g[np.ix_(ys, xs)]
    kern = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    try:
        import cv2

        lap = cv2.filter2D(g, -1, kern)
    except ImportError:
        from numpy.lib.stride_tricks import sliding_window_view

        windows = sliding_window_view(g, (3, 3))
        lap = np.einsum("ijkl,kl->ij", windows, kern)
    return float(lap.var())


def _trim_black(arr: np.ndarray) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    h, w = arr.shape[:2]
    gray = _gray(arr)
    mask = (gray > 14) & (gray < 246)
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    if rows.size < 8 or cols.size < 8:
        return arr, (0, 0, w, h)
    y1, y2 = int(rows[0]), int(rows[-1]) + 1
    x1, x2 = int(cols[0]), int(cols[-1]) + 1
    pad_y = max(2, int(0.01 * h))
    pad_x = max(2, int(0.01 * w))
    y1 = max(0, y1 - pad_y)
    x1 = max(0, x1 - pad_x)
    y2 = min(h, y2 + pad_y)
    x2 = min(w, x2 + pad_x)
    if (x2 - x1) < w * 0.72 or (y2 - y1) < h * 0.72:
        return arr, (0, 0, w, h)
    if x1 == 0 and y1 == 0 and x2 == w and y2 == h:
        return arr, (0, 0, w, h)
    return arr[y1:y2, x1:x2], (x1, y1, x2, y2)


def _clahe_rgb(arr: np.ndarray) -> np.ndarray:
    try:
        import cv2

        lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l2 = clahe.apply(l)
        out = cv2.merge((l2, a, b))
        return cv2.cvtColor(out, cv2.COLOR_LAB2RGB)
    except ImportError:
        from PIL import Image, ImageOps

        img = Image.fromarray(arr)
        eq = ImageOps.autocontrast(img, cutoff=1)
        return np.array(eq)


def _maybe_invert_lightbox(arr: np.ndarray) -> tuple[np.ndarray, bool]:
    gray = _gray(arr)
    h, w = gray.shape
    band = max(2, int(0.04 * min(h, w)))
    corners = np.concatenate(
        [
            gray[:band, :band].ravel(),
            gray[:band, -band:].ravel(),
            gray[-band:, :band].ravel(),
            gray[-band:, -band:].ravel(),
        ]
    )
    if float(corners.mean()) > 170 and float(gray.mean()) > 130:
        return 255 - arr, True
    return arr, False


def assess(arr: np.ndarray) -> dict[str, Any]:
    h, w = arr.shape[:2]
    gray = _gray(arr)
    mean = float(gray.mean())
    sharp = _laplacian_var(gray)
    aspect = w / max(1, h)
    flags: list[str] = []
    if w < 900 or h < 350:
        flags.append("small")
    if aspect < 1.45:
        flags.append("narrow")
    if sharp < 18:
        flags.append("blur")
    if mean < 38:
        flags.append("dark")
    if mean > 188:
        flags.append("bright")
    if w * h < 1_200_000 and sharp < 40:
        flags.append("compressed")
    if "small" in flags or "blur" in flags or "narrow" in flags:
        level = "poor" if ("small" in flags and "blur" in flags) or sharp < 10 else "fair"
        if "small" in flags and "narrow" in flags:
            level = "poor"
    elif flags:
        level = "fair"
    else:
        level = "good"
    return {
        "level": level,
        "flags": flags,
        "width": int(w),
        "height": int(h),
        "sharpness": round(sharp, 2),
        "mean": round(mean, 1),
        "aspect": round(aspect, 3),
    }


def prepare(arr: np.ndarray) -> dict[str, Any]:
    original = arr
    oh, ow = original.shape[:2]
    quality = assess(original)
    work, inverted = _maybe_invert_lightbox(original)
    cropped, box = _trim_black(work)
    prepared = _clahe_rgb(cropped)
    x1, y1, x2, y2 = box
    quality["inverted"] = inverted
    quality["cropped"] = box != (0, 0, ow, oh)
    quality["prepared"] = True
    if inverted:
        quality["flags"] = list(dict.fromkeys([*quality["flags"], "inverted"]))
    if quality["cropped"]:
        quality["flags"] = list(dict.fromkeys([*quality["flags"], "crop"]))
    quality["boosts"] = floor_boosts(quality)
    return {
        "image": prepared,
        "quality": quality,
        "origin": (ow, oh),
        "crop": box,
    }


def remap_xyxyn(
    xyxyn: list[float],
    origin: tuple[int, int],
    crop: tuple[int, int, int, int],
) -> list[float]:
    ow, oh = origin
    x1, y1, x2, y2 = crop
    cw = max(1, x2 - x1)
    ch = max(1, y2 - y1)
    rx1, ry1, rx2, ry2 = xyxyn
    return [
        max(0.0, min(1.0, (rx1 * cw + x1) / ow)),
        max(0.0, min(1.0, (ry1 * ch + y1) / oh)),
        max(0.0, min(1.0, (rx2 * cw + x1) / ow)),
        max(0.0, min(1.0, (ry2 * ch + y1) / oh)),
    ]


def floor_boosts(quality: dict[str, Any]) -> dict[str, float]:
    level = quality.get("level")
    if level == "poor":
        return dict(BOOST_POOR)
    if level == "fair":
        return dict(BOOST_FAIR)
    return {}
