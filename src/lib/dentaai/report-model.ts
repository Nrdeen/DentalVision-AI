import { suggestedApproach } from "./clinical";
import { findingDesc, findingLabel, positionLabel, severityLabel, t } from "./i18n";
import { fuseFindings, getRecommendationKeys } from "./fusion";
import { isToothEstimated, toothDisplay } from "./tooth-numbering";
import type { Finding, Lang, MIOClassification, Modality, Severity } from "./types";

const RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export interface ReportRow {
  n: number;
  finding: Finding;
  label: string;
  tooth: string | null;
  toothEstimated: boolean;
  region: string;
  confidence: number;
  severity: Severity;
  severityText: string;
  description: string;
  approach: string;
}

export interface ToothMark {
  severity: Severity;
  estimated: boolean;
  count: number;
}

export interface QuadrantMark {
  q: 1 | 2 | 3 | 4;
  label: string;
  count: number;
  severity: Severity | null;
}

export interface ReportModel {
  lang: Lang;
  modality: Modality;
  reportId: string;
  generatedAt: Date;
  title: string;
  studyType: string;
  total: number;
  counts: Record<Severity, number>;
  avgConfidence: number;
  rows: ReportRow[];
  priority: ReportRow[];
  types: Array<{ key: string; label: string; count: number; colorVar: string }>;
  teethMarks: Map<number, ToothMark>;
  quadrants: QuadrantMark[];
  impression: string;
  recommendations: Array<{ title: string; text: string }>;
  hasEstimatedTeeth: boolean;
  mio: { label: string; confidence: number; probabilities: Array<{ label: string; value: number }> } | null;
}

function worst(a: Severity | undefined, b: Severity): Severity {
  return a && RANK[a] >= RANK[b] ? a : b;
}

function quadrantFromPosition(positionKey: string): 1 | 2 | 3 | 4 | null {
  const upper = /upper/i.test(positionKey);
  const lower = /lower/i.test(positionKey);
  const right = /right/i.test(positionKey);
  const left = /left/i.test(positionKey);
  if (upper === lower || right === left) return null;
  if (upper) return right ? 1 : 2;
  return left ? 3 : 4;
}

function quadrantLabel(q: 1 | 2 | 3 | 4, lang: Lang) {
  const tr = ["Üst Sağ", "Üst Sol", "Alt Sol", "Alt Sağ"];
  const en = ["Upper Right", "Upper Left", "Lower Left", "Lower Right"];
  return `Q${q} · ${(lang === "tr" ? tr : en)[q - 1]}`;
}

function makeReportId(findings: Finding[], modality: Modality, date: Date) {
  const seed = findings.map((f) => f.id).join("|") + date.toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `DV-${day}-${modality === "xray" ? "XR" : "IO"}-${h.toString(36).toUpperCase().padStart(4, "0").slice(0, 5)}`;
}

function impressionText(
  lang: Lang,
  modality: Modality,
  counts: Record<Severity, number>,
  rows: ReportRow[],
  priority: ReportRow[],
) {
  const tr = lang === "tr";
  const what = modality === "xray" ? (tr ? "panoramik radyografide" : "the panoramic radiograph") : tr ? "ağız içi görüntüde" : "the intraoral image";
  if (rows.length === 0) {
    return tr
      ? `Belirgin bir bulgu tespit edilmedi (${what}).`
      : `No significant findings were detected in ${what}.`;
  }
  const top = priority[0];
  const where = top.tooth ? `${tr ? "diş" : "tooth"} ${top.tooth}` : top.region;
  const pct = Math.round(top.confidence * 100);
  if (tr) {
    return `${what.charAt(0).toUpperCase()}${what.slice(1)} ${rows.length} bulgu tespit edildi (${counts.high} yüksek, ${counts.medium} orta, ${counts.low} düşük öncelik). En öncelikli bulgu: ${where} – ${top.label} (%${pct}).`;
  }
  return `${rows.length} finding${rows.length > 1 ? "s were" : " was"} detected in ${what} (${counts.high} high, ${counts.medium} medium, ${counts.low} low priority). Highest priority: ${top.label} at ${where} (${pct}%).`;
}

export function computeToothMarks(findings: Finding[]) {
  const teeth = new Map<number, ToothMark>();
  const quads = new Map<number, { severity: Severity; count: number }>();
  for (const f of findings) {
    const confirmed = (f.tooth.match(/\b[1-4][1-8]\b/g) ?? []).map(Number);
    const numbers = confirmed.length ? confirmed : (f.toothEst ?? []).map(Number);
    if (numbers.length) {
      for (const n of numbers) {
        const prev = teeth.get(n);
        teeth.set(n, {
          severity: worst(prev?.severity, f.severity),
          estimated: (prev?.estimated ?? true) && confirmed.length === 0,
          count: (prev?.count ?? 0) + 1,
        });
      }
    } else {
      const q = quadrantFromPosition(f.positionKey);
      if (q) {
        const prev = quads.get(q);
        quads.set(q, { severity: worst(prev?.severity, f.severity), count: (prev?.count ?? 0) + 1 });
      }
    }
  }
  return { teeth, quads };
}

export function buildReport(opts: {
  lang: Lang;
  modality: Modality;
  findings: Finding[];
  mio?: MIOClassification | null;
  now?: Date;
}): ReportModel {
  const { lang, modality, findings } = opts;
  const tr = lang === "tr";
  const now = opts.now ?? new Date();

  const rows: ReportRow[] = findings.map((f, i) => ({
    n: i + 1,
    finding: f,
    label: findingLabel(lang, f.key),
    tooth: toothDisplay(f),
    toothEstimated: isToothEstimated(f),
    region: positionLabel(lang, f.positionKey),
    confidence: f.confidence,
    severity: f.severity,
    severityText: severityLabel(lang, f.severity),
    description: findingDesc(lang, f.descriptionKey),
    approach: suggestedApproach(f.key, lang),
  }));

  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  rows.forEach((r) => (counts[r.severity] += 1));
  const avgConfidence = rows.length ? rows.reduce((s, r) => s + r.confidence, 0) / rows.length : 0;
  const priority = [...rows].sort(
    (a, b) => RANK[b.severity] - RANK[a.severity] || b.confidence - a.confidence,
  );

  const typeMap = new Map<string, { key: string; label: string; count: number; colorVar: string }>();
  for (const r of rows) {
    const prev = typeMap.get(r.finding.key);
    typeMap.set(r.finding.key, {
      key: r.finding.key,
      label: r.label,
      colorVar: r.finding.colorVar,
      count: (prev?.count ?? 0) + 1,
    });
  }

  const { teeth } = computeToothMarks(findings);
  const quadrantCounts = new Map<number, QuadrantMark>();
  for (const q of [1, 2, 3, 4] as const) {
    quadrantCounts.set(q, { q, label: quadrantLabel(q, lang), count: 0, severity: null });
  }
  for (const r of rows) {
    const first = (r.finding.tooth !== "-" ? r.finding.tooth : r.finding.toothEst?.[0]) ?? "";
    const q = /^[1-4]/.test(first) ? (Number(first[0]) as 1 | 2 | 3 | 4) : quadrantFromPosition(r.finding.positionKey);
    if (!q) continue;
    const m = quadrantCounts.get(q)!;
    m.count += 1;
    m.severity = worst(m.severity ?? undefined, r.severity);
  }

  const fusion = fuseFindings(modality === "xray" ? findings : [], modality === "intraoral" ? findings : []);
  const seen = new Set<string>();
  const recommendations: Array<{ title: string; text: string }> = [];
  for (const r of priority) {
    if (seen.has(r.finding.key)) continue;
    seen.add(r.finding.key);
    recommendations.push({ title: r.label, text: r.approach });
  }
  const general = getRecommendationKeys(fusion).filter((k) => k === "report.rec4");
  general.forEach((k) => recommendations.push({ title: tr ? "Genel" : "General", text: t(lang, k) }));

  const mio = opts.mio
    ? {
        label: mioLabel(opts.mio.class_name, lang),
        confidence: opts.mio.confidence,
        probabilities: (Object.entries(opts.mio.probabilities ?? {}) as Array<[MIOClassification["class_name"], number]>)
          .map(([k, v]) => ({ label: mioLabel(k, lang), value: v }))
          .sort((a, b) => b.value - a.value),
      }
    : null;

  return {
    lang,
    modality,
    reportId: makeReportId(findings, modality, now),
    generatedAt: now,
    title:
      modality === "xray"
        ? tr
          ? "Panoramik Radyografi Analiz Raporu"
          : "Panoramic Radiograph Analysis Report"
        : tr
          ? "Ağız İçi Analiz Raporu"
          : "Intraoral Analysis Report",
    studyType:
      modality === "xray"
        ? tr
          ? "Panoramik röntgen"
          : "Panoramic X-ray"
        : tr
          ? "Ağız içi fotoğraf"
          : "Intraoral photograph",
    total: rows.length,
    counts,
    avgConfidence,
    rows,
    priority,
    types: [...typeMap.values()].sort((a, b) => b.count - a.count),
    teethMarks: teeth,
    quadrants: [...quadrantCounts.values()],
    impression: impressionText(lang, modality, counts, rows, priority),
    recommendations,
    hasEstimatedTeeth: rows.some((r) => r.toothEstimated),
    mio,
  };
}

function mioLabel(cls: MIOClassification["class_name"], lang: Lang) {
  const map = {
    healthy: { tr: "Sağlıklı", en: "Healthy" },
    gingivitis: { tr: "Gingivitis", en: "Gingivitis" },
    periodontitis: { tr: "Periodontitis", en: "Periodontitis" },
  } as const;
  return map[cls][lang];
}
