/** FDI helpers. Quadrants: 1 UR, 2 UL, 3 LL, 4 LR (patient view). */

export type Quadrant = 1 | 2 | 3 | 4;

export function parseFdiList(raw: string | undefined): string[] {
  if (!raw || raw === "-") return [];
  return raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^≈/, "").trim())
    .filter((t) => /^\d{2}$/.test(t));
}

export function quadrantOfFdi(fdi: string): Quadrant | null {
  const q = Number(fdi[0]);
  return q >= 1 && q <= 4 ? (q as Quadrant) : null;
}

export function isSameTooth(a: string, b: string) {
  return parseFdiList(a)[0] === parseFdiList(b)[0] && Boolean(parseFdiList(a)[0]);
}
