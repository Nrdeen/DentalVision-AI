import { t } from "./i18n";
import { buildReport, type ReportModel, type ReportRow } from "./report-model";
import { useApp } from "./store";
import type { Finding, FusionResult, Lang, Severity } from "./types";

// ---------------------------------------------------------------------------
// Minimal PDF writer: each A4 page is a canvas rendered to JPEG.
// ---------------------------------------------------------------------------

interface PageData {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

const A4_W = 595.28;
const A4_H = 841.89;

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, part) => n + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function jpegToPdf(pages: PageData[]): Blob {
  const encoder = new TextEncoder();
  const objects: Uint8Array[] = [];
  const pushText = (text: string) => objects.push(encoder.encode(text));

  const pageKids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  pushText("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
  pushText(`2 0 obj << /Type /Pages /Kids [${pageKids}] /Count ${pages.length} >> endobj\n`);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = 3 + i * 3;
    const contentNum = pageNum + 1;
    const imageNum = pageNum + 2;

    pushText(
      `${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] /Contents ${contentNum} 0 R /Resources << /XObject << /Im0 ${imageNum} 0 R >> >> >> endobj\n`,
    );
    const stream = `q ${A4_W} 0 0 ${A4_H} 0 0 cm /Im0 Do Q`;
    pushText(`${contentNum} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`);
    // The JPEG and its dictionary must be one PDF object. Splitting them makes the
    // xref point inside the image, so viewers draw every page after the first as blank.
    objects.push(
      concatBytes([
        encoder.encode(
          `${imageNum} 0 obj << /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >> stream\n`,
        ),
        page.jpeg,
        encoder.encode("\nendstream endobj\n"),
      ]),
    );
  }

  const header = encoder.encode("%PDF-1.4\n");
  const chunks: Uint8Array[] = [header];
  const offsets = [0];
  let pos = header.length;
  for (const obj of objects) {
    offsets.push(pos);
    chunks.push(obj);
    pos += obj.length;
  }
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;
  chunks.push(encoder.encode(xref));
  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

// ---------------------------------------------------------------------------
// Drawing helpers (design units: 794 x 1123 = A4 at 96 dpi, rendered at 2x)
// ---------------------------------------------------------------------------

const PW = 794;
const PH = 1123;
const SC = 2;
const MX = 40;
const CW = PW - MX * 2;
const TOP = 84;
const BOTTOM = PH - 52;
const FONT = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';

const INK = "#1b2430";
const MUTED = "#5b6b80";
const LINE = "#e3e9f1";
const SOFT = "#f4f7fb";
const PRIMARY = "#2f6fed";

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function severityColor(s: Severity) {
  return cssVar(`--color-${s}`, s === "high" ? "#e11d48" : s === "medium" ? "#d97706" : "#059669");
}

function findingColor(f: Finding) {
  return cssVar(f.colorVar, "#e11d48");
}

type TextOpts = { size?: number; weight?: number; color?: string; align?: CanvasTextAlign };

class Doc {
  pages: HTMLCanvasElement[] = [];
  ctx!: CanvasRenderingContext2D;
  y = TOP;

  constructor(
    private readonly lang: Lang,
    private readonly reportId: string,
    private readonly generatedAt: Date,
  ) {
    this.newPage();
  }

  newPage() {
    const canvas = document.createElement("canvas");
    canvas.width = PW * SC;
    canvas.height = PH * SC;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.scale(SC, SC);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PW, PH);
    this.pages.push(canvas);
    this.ctx = ctx;
    this.drawRunningHeader();
    this.y = TOP;
  }

  ensure(h: number) {
    if (this.y + h > BOTTOM) this.newPage();
  }

  private drawRunningHeader() {
    const { ctx } = this;
    this.rr(MX, 26, 24, 24, 7, PRIMARY);
    this.text("D", MX + 12, 44, { size: 15, weight: 800, color: "#fff", align: "center" });
    this.text("DentaAI", MX + 34, 40, { size: 13, weight: 800 });
    this.text(this.lang === "tr" ? "Akıllı çoklu ortamlı diş teşhis sistemi" : "Multimodal dental diagnosis system", MX + 34, 52, {
      size: 8,
      color: MUTED,
    });
    this.text(this.reportId, PW - MX, 40, { size: 9, weight: 700, align: "right" });
    this.text(this.generatedAt.toLocaleString(this.lang === "tr" ? "tr-TR" : "en-GB"), PW - MX, 52, {
      size: 8,
      color: MUTED,
      align: "right",
    });
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MX, 62);
    ctx.lineTo(PW - MX, 62);
    ctx.stroke();
  }

  finish() {
    const total = this.pages.length;
    this.pages.forEach((canvas, i) => {
      const ctx = canvas.getContext("2d")!;
      this.ctx = ctx;
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.moveTo(MX, PH - 38);
      ctx.lineTo(PW - MX, PH - 38);
      ctx.stroke();
      this.text(`DentaAI · ${this.reportId}`, MX, PH - 22, { size: 8, color: MUTED });
      this.text(`${this.lang === "tr" ? "Sayfa" : "Page"} ${i + 1} / ${total}`, PW - MX, PH - 22, {
        size: 8,
        color: MUTED,
        align: "right",
      });
    });
  }

  text(str: string, x: number, y: number, o: TextOpts = {}) {
    const { ctx } = this;
    ctx.font = `${o.weight ?? 500} ${o.size ?? 10}px ${FONT}`;
    ctx.fillStyle = o.color ?? INK;
    ctx.textAlign = o.align ?? "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(str, x, y);
  }

  lines(str: string, maxW: number, o: TextOpts = {}): string[] {
    const { ctx } = this;
    ctx.font = `${o.weight ?? 500} ${o.size ?? 10}px ${FONT}`;
    const out: string[] = [];
    let line = "";
    for (const word of str.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxW) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
    return out;
  }

  paragraph(str: string, x: number, y: number, maxW: number, lineH: number, o: TextOpts = {}) {
    const ls = this.lines(str, maxW, o);
    ls.forEach((l, i) => this.text(l, x, y + i * lineH, o));
    return ls.length * lineH;
  }

  rr(x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw = 1) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  tint(color: string, alpha: number, draw: () => void) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    draw();
    ctx.restore();
  }

  pin(n: number, x: number, y: number, color: string, r = 8) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    this.text(String(n), x, y + r * 0.38, { size: r * 1.1, weight: 800, color: "#fff", align: "center" });
  }

  sectionTitle(title: string, subtitle?: string) {
    this.ensure(34);
    this.rr(MX, this.y, 3, 14, 1.5, PRIMARY);
    this.text(title, MX + 10, this.y + 11, { size: 12, weight: 800 });
    if (subtitle) this.text(subtitle, PW - MX, this.y + 11, { size: 8.5, color: MUTED, align: "right" });
    this.y += 26;
  }
}

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function drawInfoGrid(doc: Doc, model: ReportModel, lang: Lang, title: string, combined: boolean) {
  const tr = lang === "tr";
  doc.text(title, MX, doc.y + 18, { size: 20, weight: 800 });
  doc.y += 30;
  doc.text(
    combined
      ? tr
        ? "Panoramik röntgen ve ağız içi görüntü analizlerinin birleşik değerlendirmesi"
        : "Combined evaluation of panoramic X-ray and intraoral image analyses"
      : tr
        ? "Yapay zekâ destekli görüntü analizi"
        : "AI-assisted image analysis",
    MX,
    doc.y + 2,
    { size: 10, color: MUTED },
  );
  doc.y += 18;

  const cells: Array<[string, string | null]> = [
    [tr ? "HASTA ADI" : "PATIENT NAME", null],
    [tr ? "HASTA / PROTOKOL NO" : "PATIENT / PROTOCOL ID", null],
    [tr ? "RAPOR TARİHİ" : "REPORT DATE", model.generatedAt.toLocaleDateString(tr ? "tr-TR" : "en-GB")],
    [tr ? "RAPOR NO" : "REPORT ID", model.reportId],
    [tr ? "TETKİK" : "STUDY", combined ? (tr ? "Panoramik röntgen + ağız içi fotoğraf" : "Panoramic X-ray + intraoral photo") : model.studyType],
    [tr ? "SEVK EDEN HEKİM" : "REFERRING CLINICIAN", null],
  ];
  const gap = 8;
  const cw = (CW - gap * 2) / 3;
  const ch = 38;
  cells.forEach(([label, value], i) => {
    const x = MX + (i % 3) * (cw + gap);
    const y = doc.y + Math.floor(i / 3) * (ch + gap);
    doc.rr(x, y, cw, ch, 8, SOFT);
    doc.text(label, x + 10, y + 14, { size: 7, weight: 700, color: MUTED });
    if (value) {
      doc.text(value, x + 10, y + 29, { size: 10.5, weight: 700 });
    } else {
      doc.ctx.strokeStyle = "#c5cfdc";
      doc.ctx.lineWidth = 0.8;
      doc.ctx.beginPath();
      doc.ctx.moveTo(x + 10, y + 30);
      doc.ctx.lineTo(x + cw - 10, y + 30);
      doc.ctx.stroke();
    }
  });
  doc.y += ch * 2 + gap + 20;
}

function drawSummaryTiles(doc: Doc, model: ReportModel, lang: Lang) {
  const tr = lang === "tr";
  const tiles: Array<{ label: string; value: string; color: string }> = [
    { label: tr ? "Toplam bulgu" : "Total findings", value: String(model.total), color: INK },
    { label: tr ? "Yüksek öncelik" : "High priority", value: String(model.counts.high), color: severityColor("high") },
    { label: tr ? "Orta öncelik" : "Medium priority", value: String(model.counts.medium), color: severityColor("medium") },
    { label: tr ? "Düşük öncelik" : "Low priority", value: String(model.counts.low), color: severityColor("low") },
    { label: tr ? "Ort. güven" : "Avg. confidence", value: `${Math.round(model.avgConfidence * 100)}%`, color: PRIMARY },
  ];
  const gap = 8;
  const w = (CW - gap * 4) / 5;
  doc.ensure(64);
  tiles.forEach((tile, i) => {
    const x = MX + i * (w + gap);
    doc.rr(x, doc.y, w, 52, 10, "#fff", LINE);
    doc.text(tile.value, x + w / 2, doc.y + 28, { size: 20, weight: 800, color: tile.color, align: "center" });
    doc.text(tile.label, x + w / 2, doc.y + 43, { size: 7.5, color: MUTED, align: "center" });
  });
  doc.y += 52 + 14;
}

function drawImpression(doc: Doc, model: ReportModel, lang: Lang) {
  const tr = lang === "tr";
  const ls = doc.lines(model.impression, CW - 28, { size: 10.5 });
  const h = 34 + ls.length * 15;
  doc.ensure(h + 10);
  doc.rr(MX, doc.y, CW, h, 10, "#eef4ff");
  doc.rr(MX, doc.y, 4, h, 2, PRIMARY);
  doc.text(tr ? "KLİNİK İZLENİM" : "CLINICAL IMPRESSION", MX + 16, doc.y + 18, { size: 8, weight: 800, color: PRIMARY });
  ls.forEach((l, i) => doc.text(l, MX + 16, doc.y + 35 + i * 15, { size: 10.5 }));
  doc.y += h + 16;
}

function drawAnnotatedImage(doc: Doc, model: ReportModel, img: HTMLImageElement | null, lang: Lang) {
  if (!img) return;
  const tr = lang === "tr";
  const ar = img.naturalHeight / img.naturalWidth;
  const maxH = model.modality === "xray" ? 330 : 380;
  const h = Math.min(maxH, CW * ar);
  const w = h / ar;
  doc.sectionTitle(
    tr ? "İşaretli görüntü" : "Annotated image",
    tr ? "Numaralar bulgu listesiyle eşleşir" : "Numbers match the findings list",
  );
  doc.ensure(h + 12);
  const x = MX + (CW - w) / 2;
  const y = doc.y;
  const { ctx } = doc;
  doc.rr(MX, y, CW, h, 10, "#0b0f14");
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);

  const pins: Array<[number, number]> = [];
  model.rows.forEach((r) => {
    const f = r.finding;
    const color = findingColor(f);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = color;
    if (f.mask?.length) {
      ctx.beginPath();
      f.mask.forEach(([mx, my], i) => (i ? ctx.lineTo(x + mx * w, y + my * h) : ctx.moveTo(x + mx * w, y + my * h)));
      ctx.closePath();
      doc.tint(color, 0.18, () => ctx.fill());
      ctx.stroke();
    } else {
      const [x1, y1, x2, y2] = f.bbox;
      ctx.strokeRect(x + x1 * w, y + y1 * h, (x2 - x1) * w, (y2 - y1) * h);
    }
  });
  model.rows.forEach((r) => {
    const [x1, y1] = r.finding.bbox;
    let px = x + x1 * w + 2;
    const py = y + Math.max(10, y1 * h - 6);
    for (let tries = 0; tries < 8 && pins.some(([ox, oy]) => Math.hypot(ox - px, oy - py) < 17); tries++) px += 18;
    pins.push([px, py]);
    doc.pin(r.n, px, py, findingColor(r.finding));
  });
  ctx.restore();
  doc.y += h + 16;
}

// Same FDI geometry as the on-screen chart.
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const WIDTH = [0, 14, 12, 13, 12, 12, 17, 17, 16];

function drawDentalChart(doc: Doc, model: ReportModel, lang: Lang) {
  const tr = lang === "tr";
  const SLOT = 18.4;
  const MID = 10;
  const PAD = 12;
  const chartW = PAD * 2 + SLOT * 16 + MID;
  const chartH = 158;
  const k = 1.18;
  const blockH = chartH * k + 8;

  doc.sectionTitle(tr ? "Diş şeması (FDI)" : "Dental chart (FDI)");
  doc.ensure(blockH + 14);
  const x0 = MX;
  const y0 = doc.y;
  const { ctx } = doc;

  doc.rr(MX, y0 - 4, chartW * k + 16, blockH + 4, 10, "#fff", LINE);
  ctx.save();
  ctx.translate(x0 + 8, y0);
  ctx.scale(k, k);

  const toothX = (i: number) => PAD + i * SLOT + (i >= 8 ? MID : 0);
  const draw = (numbers: number[], upper: boolean) =>
    numbers.forEach((fdi, i) => {
      const mark = model.teethMarks.get(fdi);
      const pos = i < 8 ? 8 - i : i - 7;
      const w = WIDTH[pos];
      const x = toothX(i) + (SLOT - w) / 2;
      const y = upper ? 20 : 92;
      const crownH = 44 * 0.52;
      const crownY = upper ? y + 44 - crownH : y;
      const rootBase = upper ? crownY : crownY + crownH;
      const rootTip = upper ? y : y + 44;
      const color = mark ? severityColor(mark.severity) : null;

      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, rootBase);
      ctx.lineTo(x + w * 0.5, rootTip);
      ctx.lineTo(x + w * 0.8, rootBase);
      ctx.closePath();
      ctx.fillStyle = "#f1f5f9";
      ctx.fill();
      if (color) doc.tint(color, 0.28, () => ctx.fill());
      ctx.strokeStyle = color ?? "#cbd5e1";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      doc.rr(x, crownY, w, crownH, 4, "#f8fafc");
      if (color) {
        doc.tint(color, 0.5, () => {
          doc.rr(x, crownY, w, crownH, 4);
          ctx.fill();
        });
      }
      ctx.setLineDash(mark?.estimated ? [2.5, 1.8] : []);
      doc.rr(x, crownY, w, crownH, 4, undefined, color ?? "#cbd5e1", 1);
      ctx.setLineDash([]);
      doc.text(String(fdi), x + w / 2, upper ? 14 : 92 + 44 + 12, {
        size: 7.5,
        weight: mark ? 800 : 500,
        color: mark ? INK : MUTED,
        align: "center",
      });
    });
  draw(UPPER, true);
  draw(LOWER, false);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(PAD, 79);
  ctx.lineTo(chartW - PAD, 79);
  ctx.moveTo(chartW / 2, 14);
  ctx.lineTo(chartW / 2, 150);
  ctx.stroke();
  ctx.setLineDash([]);
  doc.text("R", 4, 86, { size: 8, weight: 800, color: MUTED });
  doc.text("L", chartW - 4, 86, { size: 8, weight: 800, color: MUTED, align: "right" });
  ctx.restore();

  // Right column: legend + quadrant counts.
  const rx = x0 + chartW * k + 34;
  let ry = y0 + 12;
  (["high", "medium", "low"] as Severity[]).forEach((s) => {
    doc.ctx.beginPath();
    doc.ctx.arc(rx + 4, ry - 3, 3.5, 0, Math.PI * 2);
    doc.ctx.fillStyle = severityColor(s);
    doc.ctx.fill();
    doc.text(s === "high" ? (tr ? "Yüksek öncelik" : "High priority") : s === "medium" ? (tr ? "Orta öncelik" : "Medium priority") : tr ? "Düşük öncelik" : "Low priority", rx + 14, ry, { size: 9 });
    ry += 15;
  });
  ry += 8;
  doc.text(tr ? "KADRAN DAĞILIMI" : "QUADRANT DISTRIBUTION", rx, ry, { size: 7.5, weight: 800, color: MUTED });
  ry += 14;
  model.quadrants.forEach((q) => {
    doc.text(q.label, rx, ry, { size: 9, color: q.count ? INK : MUTED });
    doc.text(String(q.count), PW - MX - 8, ry, { size: 9, weight: 800, color: q.count ? INK : MUTED, align: "right" });
    ry += 15;
  });
  if (model.hasEstimatedTeeth) {
    doc.paragraph(
      tr
        ? "≈ Kesikli çizgili dişler: numara kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)."
        : "≈ Dashed teeth: numbers are estimated from arch geometry (not model output).",
      rx,
      ry + 6,
      PW - MX - rx - 8,
      11,
      { size: 8, color: MUTED },
    );
  }
  doc.y += blockH + 12;
}

function drawFindingCard(doc: Doc, row: ReportRow, img: HTMLImageElement | null, lang: Lang) {
  const tr = lang === "tr";
  const thumbW = img ? 112 : 0;
  const thumbH = 84;
  const padding = 12;
  const textX = MX + padding + (img ? thumbW + 14 : 0);
  const textW = MX + CW - padding - textX;

  const title = `${row.tooth ? `${tr ? "Diş" : "Tooth"} ${row.tooth} – ` : ""}${row.label}`;
  const descLines = doc.lines(row.description, textW, { size: 9.5 });
  const verificationNote = row.finding.key === "xrayKuretaj"
    ? tr
      ? "Not: Yerel etiket; klinik anlamı kaynakta doğrulanmamıştır."
      : "Note: Local label; its clinical meaning is not verified by the source."
    : "";
  const noteLines = verificationNote ? doc.lines(verificationNote, textW, { size: 8.5 }) : [];
  const approachLines = doc.lines(row.approach, textW - 12, { size: 9.5 });
  const textH =
    22 +
    14 +
    10 +
    descLines.length * 13 +
    (noteLines.length ? 5 + noteLines.length * 12 : 0) +
    8 +
    14 +
    approachLines.length * 13 +
    6;
  const h = Math.max(thumbH + padding * 2, textH + padding * 2 - 6);

  doc.ensure(h + 10);
  const y = doc.y;
  const color = findingColor(row.finding);
  doc.rr(MX, y, CW, h, 10, "#fff", LINE);
  doc.rr(MX, y, 4, h, 2, severityColor(row.severity));

  if (img) {
    const tx = MX + padding + 2;
    const ty = y + padding;
    const f = row.finding;
    const [x1, y1, x2, y2] = f.bbox;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const bw = (x2 - x1) * iw;
    const bh = (y2 - y1) * ih;
    const padX = Math.max(bw * 0.45, iw * 0.02);
    const padY = Math.max(bh * 0.45, ih * 0.02);
    let sx = Math.max(0, x1 * iw - padX);
    let sy = Math.max(0, y1 * ih - padY);
    let sw = Math.min(iw - sx, bw + padX * 2);
    let sh = Math.min(ih - sy, bh + padY * 2);
    // Keep the crop aspect equal to the thumbnail box.
    const boxAr = thumbW / thumbH;
    if (sw / sh > boxAr) {
      const nh = sw / boxAr;
      sy = Math.max(0, Math.min(ih - nh, sy - (nh - sh) / 2));
      sh = Math.min(nh, ih - sy);
    } else {
      const nw = sh * boxAr;
      sx = Math.max(0, Math.min(iw - nw, sx - (nw - sw) / 2));
      sw = Math.min(nw, iw - sx);
    }
    const { ctx } = doc;
    ctx.save();
    doc.rr(tx, ty, thumbW, thumbH, 8);
    ctx.clip();
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(tx, ty, thumbW, thumbH);
    const scale = Math.min(thumbW / sw, thumbH / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = tx + (thumbW - dw) / 2;
    const dy = ty + (thumbH - dh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(dx + (x1 * iw - sx) * scale, dy + (y1 * ih - sy) * scale, bw * scale, bh * scale);
    ctx.restore();
    doc.rr(tx, ty, thumbW, thumbH, 8, undefined, LINE);
    doc.pin(row.n, tx + 2, ty + 2, color, 9);
  } else {
    doc.pin(row.n, MX + padding + 8, y + padding + 8, color, 9);
  }

  const tx0 = img ? textX : textX + 24;
  let cy = y + padding + 12;
  doc.text(title, tx0, cy, { size: 11.5, weight: 800 });

  // Severity pill + confidence on the right.
  const pct = `${Math.round(row.confidence * 100)}%`;
  doc.text(pct, MX + CW - padding, cy, { size: 11.5, weight: 800, align: "right" });
  doc.ctx.font = `800 8.5px ${FONT}`;
  const pillW = doc.ctx.measureText(row.severityText).width + 18;
  const pillX = MX + CW - padding - 38 - pillW;
  doc.tint(severityColor(row.severity), 0.14, () => {
    doc.rr(pillX, cy - 11, pillW, 15, 7.5);
    doc.ctx.fill();
  });
  doc.text(row.severityText, pillX + pillW / 2, cy, { size: 8.5, weight: 800, color: severityColor(row.severity), align: "center" });

  cy += 13;
  doc.text(row.region, tx0, cy, { size: 9, color: MUTED });
  cy += 9;
  const barW = textW - (img ? 0 : 24);
  doc.rr(tx0, cy, barW, 4, 2, "#e8eef6");
  doc.rr(tx0, cy, Math.max(4, barW * row.confidence), 4, 2, color);
  cy += 18;
  descLines.forEach((l, i) => doc.text(l, tx0, cy + i * 13, { size: 9.5, color: "#33415a" }));
  cy += descLines.length * 13 + 6;
  if (noteLines.length) {
    noteLines.forEach((l, i) => doc.text(l, tx0, cy + i * 12, { size: 8.5, color: MUTED }));
    cy += noteLines.length * 12 + 5;
  }
  doc.text(tr ? "Önerilen yaklaşım" : "Suggested approach", tx0, cy, { size: 8.5, weight: 800, color: PRIMARY });
  cy += 13;
  approachLines.forEach((l, i) => doc.text(l, tx0, cy + i * 13, { size: 9.5, color: MUTED }));

  doc.y += h + 8;
}

function drawMio(doc: Doc, model: ReportModel, lang: Lang) {
  if (!model.mio) return;
  const tr = lang === "tr";
  doc.sectionTitle(tr ? "MIO — Diş eti / periodontal sınıflama" : "MIO — gingival / periodontal classification");
  const h = 28 + model.mio.probabilities.length * 18 + 8;
  doc.ensure(h + 10);
  doc.rr(MX, doc.y, CW, h, 10, SOFT);
  doc.text(
    `${model.mio.label}  ·  ${(model.mio.confidence * 100).toFixed(1)}%`,
    MX + 14,
    doc.y + 20,
    { size: 11, weight: 800 },
  );
  model.mio.probabilities.forEach((p, i) => {
    const yy = doc.y + 40 + i * 18;
    doc.text(p.label, MX + 14, yy, { size: 9, color: MUTED });
    doc.rr(MX + 120, yy - 8, CW - 200, 6, 3, "#dfe7f2");
    doc.rr(MX + 120, yy - 8, Math.max(4, (CW - 200) * p.value), 6, 3, PRIMARY);
    doc.text(`${Math.round(p.value * 100)}%`, MX + CW - 14, yy, { size: 9, weight: 700, align: "right" });
  });
  doc.y += h + 14;
}

function drawRecommendations(doc: Doc, models: ReportModel[], lang: Lang) {
  const tr = lang === "tr";
  const seen = new Set<string>();
  const items = models
    .flatMap((m) => m.recommendations)
    .filter((r) => {
      const key = `${r.title}|${r.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (items.length === 0) return;
  doc.sectionTitle(tr ? "Öneriler" : "Recommendations");
  items.forEach((r, i) => {
    const ls = doc.lines(r.text, CW - 40, { size: 9.5 });
    const h = 22 + ls.length * 13;
    doc.ensure(h + 6);
    doc.rr(MX, doc.y, CW, h, 8, SOFT);
    doc.pin(i + 1, MX + 16, doc.y + 15, PRIMARY, 8);
    doc.text(r.title, MX + 32, doc.y + 17, { size: 10, weight: 800 });
    ls.forEach((l, j) => doc.text(l, MX + 32, doc.y + 31 + j * 13, { size: 9.5, color: MUTED }));
    doc.y += h + 6;
  });
  doc.y += 8;
}

function drawSignature(doc: Doc, lang: Lang) {
  const tr = lang === "tr";
  doc.ensure(96);
  doc.y += 10;
  const colW = (CW - 24) / 3;
  const labels = [
    tr ? "Raporu değerlendiren hekim" : "Reviewing clinician",
    tr ? "İmza / Kaşe" : "Signature / Stamp",
    tr ? "Tarih" : "Date",
  ];
  labels.forEach((label, i) => {
    const x = MX + i * (colW + 12);
    doc.ctx.strokeStyle = "#9fb0c6";
    doc.ctx.lineWidth = 0.9;
    doc.ctx.beginPath();
    doc.ctx.moveTo(x, doc.y + 40);
    doc.ctx.lineTo(x + colW, doc.y + 40);
    doc.ctx.stroke();
    doc.text(label, x, doc.y + 54, { size: 8.5, color: MUTED });
  });
  doc.y += 70;
}

function drawCombinedOverview(doc: Doc, fusion: FusionResult, lang: Lang) {
  const tr = lang === "tr";
  doc.sectionTitle(tr ? "Genel durum" : "Overall status");
  const overall = t(lang, `report.${fusion.overallKey === "low" ? "lowRisk" : fusion.overallKey}`);
  const note = t(lang, `report.${fusion.noteKey}`);
  const ls = doc.lines(`${overall} — ${note}`, CW - 28, { size: 10.5, weight: 700 });
  const h = 46 + ls.length * 15;
  doc.ensure(h + 10);
  doc.rr(MX, doc.y, CW, h, 10, "#eef4ff");
  doc.rr(MX, doc.y, 4, h, 2, PRIMARY);
  ls.forEach((l, i) => doc.text(l, MX + 16, doc.y + 22 + i * 15, { size: 10.5, weight: 700 }));
  doc.text(
    `${t(lang, "report.xrayCard")}: ${fusion.xrayCount}   ·   ${t(lang, "report.intraCard")}: ${fusion.intraCount}   ·   ${t(lang, "report.sharedCard")}: ${fusion.sharedCount}`,
    MX + 16,
    doc.y + h - 12,
    { size: 9, color: MUTED },
  );
  doc.y += h + 16;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function downloadReportPdf(opts: {
  lang: Lang;
  xray: Finding[];
  intraoral: Finding[];
  fusion: FusionResult;
  reportType: "xray" | "intraoral" | "combined";
  xrayImage?: string | null;
  intraoralImage?: string | null;
}): Promise<void> {
  const { lang, fusion, reportType } = opts;
  const tr = lang === "tr";
  const state = useApp.getState();

  try {
    await document.fonts?.load(`700 12px "Plus Jakarta Sans"`);
    await document.fonts?.load(`500 12px "Plus Jakarta Sans"`);
  } catch {
    // Falls back to system fonts.
  }

  const sections: Array<{ model: ReportModel; img: HTMLImageElement | null }> = [];
  if (reportType === "xray" || reportType === "combined") {
    const model = buildReport({ lang, modality: "xray", findings: opts.xray });
    sections.push({ model, img: await loadImage(opts.xrayImage ?? state.xrayImage) });
  }
  if (reportType === "intraoral" || reportType === "combined") {
    const model = buildReport({ lang, modality: "intraoral", findings: opts.intraoral, mio: state.mioClassification });
    sections.push({ model, img: await loadImage(opts.intraoralImage ?? state.intraoralImage) });
  }
  if (sections.length === 0) return;

  const combined = reportType === "combined";
  const first = sections[0].model;
  const reportId = combined ? first.reportId.replace(/-(XR|IO)-/, "-CB-") : first.reportId;
  const title = combined ? t(lang, "pdf.title") : first.title;

  const doc = new Doc(lang, reportId, first.generatedAt);
  drawInfoGrid(doc, first, lang, title, combined);
  if (combined) drawCombinedOverview(doc, fusion, lang);

  for (const { model, img } of sections) {
    if (combined) {
      doc.ensure(120);
      doc.rr(MX, doc.y, CW, 26, 8, PRIMARY);
      doc.text(model.title, MX + 14, doc.y + 17, { size: 11.5, weight: 800, color: "#fff" });
      doc.y += 38;
    }
    drawSummaryTiles(doc, model, lang);
    drawImpression(doc, model, lang);
    drawAnnotatedImage(doc, model, img, lang);
    if (model.modality === "xray" && model.total > 0) drawDentalChart(doc, model, lang);
    if (model.total > 0) {
      doc.ensure(170);
      doc.sectionTitle(tr ? "Bulgu listesi" : "Findings", `${model.total} ${tr ? "bulgu" : "findings"}`);
      for (const row of model.priority) drawFindingCard(doc, row, img, lang);
      doc.y += 6;
    }
    drawMio(doc, model, lang);
  }

  drawRecommendations(doc, sections.map((s) => s.model), lang);
  drawSignature(doc, lang);
  doc.finish();

  const pages: PageData[] = [];
  for (const canvas of doc.pages) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) continue;
    pages.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height });
  }

  const pdf = jpegToPdf(pages);
  const url = URL.createObjectURL(pdf);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportId}.pdf`;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}
