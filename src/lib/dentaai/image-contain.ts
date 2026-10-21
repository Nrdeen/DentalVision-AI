/** Pixel rectangle of an image drawn with object-fit: contain. */

export type ContainRect = { x: number; y: number; w: number; h: number };

export function objectContainRect(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): ContainRect {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return { x: 0, y: 0, w: Math.max(0, containerW), h: Math.max(0, containerH) };
  }
  const scale = Math.min(containerW / imageW, containerH / imageH);
  const w = imageW * scale;
  const h = imageH * scale;
  return {
    x: (containerW - w) / 2,
    y: (containerH - h) / 2,
    w,
    h,
  };
}
