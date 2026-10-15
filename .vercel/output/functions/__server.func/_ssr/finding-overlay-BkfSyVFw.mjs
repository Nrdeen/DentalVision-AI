import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as findingLabel, c as severityLabel, d as useApp, i as findingDesc, l as t, n as cn, o as isToothEstimated, s as positionLabel, u as toothDisplay } from "./store-98_nkWXH.mjs";
import { i as Tag } from "../_libs/lucide-react.mjs";
import { i as getRecommendationKeys, r as fuseFindings } from "./fusion-BQBcjWco.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/finding-overlay-BkfSyVFw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var APPROACH = {
	caries: {
		en: "Confirm with a clinical exam and bitewing radiograph; plan restoration if cavitated.",
		tr: "Klinik muayene ve bitewing radyografi ile doğrulayın; kavite varsa restorasyon planlayın."
	},
	earlyCaries: {
		en: "Consider remineralization and a close follow-up before invasive treatment.",
		tr: "İnvaziv tedaviden önce remineralizasyon ve yakın takip düşünülebilir."
	},
	deepCaries: {
		en: "Check pulp vitality; pulp therapy may be needed.",
		tr: "Pulpa canlılığını kontrol edin; pulpa tedavisi gerekebilir."
	},
	impacted: {
		en: "Assess position and proximity to adjacent teeth and nerve with CBCT if extraction or surgery is considered.",
		tr: "Çekim veya cerrahi düşünülüyorsa komşu dişlere ve sinire yakınlığı KBBT ile değerlendirin."
	},
	periapical: {
		en: "Vitality testing and periapical radiograph; consider endodontic evaluation.",
		tr: "Vitalite testi ve periapikal radyografi; endodontik değerlendirme düşünün."
	},
	rootCanal: {
		en: "Check the quality of the root filling and signs of periapical healing.",
		tr: "Kanal dolgusunun kalitesini ve periapikal iyileşme bulgularını kontrol edin."
	},
	fracture: {
		en: "Confirm clinically (transillumination, bite test) and plan restoration or extraction accordingly.",
		tr: "Klinik olarak doğrulayın (transilluminasyon, ısırma testi) ve restorasyon veya çekim planlayın."
	},
	abrasion: {
		en: "Assess brushing technique and occlusion; monitor wear progression.",
		tr: "Fırçalama tekniğini ve oklüzyonu değerlendirin; aşınmanın ilerlemesini izleyin."
	},
	crown: {
		en: "Check marginal fit and secondary caries at the crown margin.",
		tr: "Kuron kenar uyumunu ve kenarda sekonder çürük olup olmadığını kontrol edin."
	},
	filling: {
		en: "Inspect margins for leakage or secondary caries.",
		tr: "Kenar sızıntısı veya sekonder çürük açısından dolgu kenarlarını inceleyin."
	},
	plaque: {
		en: "Oral hygiene instruction and professional scaling.",
		tr: "Ağız hijyeni eğitimi ve profesyonel detartraj."
	},
	ulcer: {
		en: "Review for 10–14 days; biopsy if the lesion persists.",
		tr: "10–14 gün sonra yeniden değerlendirin; devam ederse biyopsi düşünün."
	},
	gingivitis: {
		en: "Oral hygiene instruction and scaling; re-evaluate in 2–4 weeks.",
		tr: "Ağız hijyeni eğitimi ve detartraj; 2–4 hafta sonra yeniden değerlendirin."
	},
	periodontitis: {
		en: "Periodontal probing and radiographic bone-level assessment are advised.",
		tr: "Periodontal sondalama ve radyografik kemik seviyesi değerlendirmesi önerilir."
	}
};
var CARIES_CLASS = {
	en: "Confirm clinically; choose restoration according to the caries class and extent.",
	tr: "Klinik olarak doğrulayın; çürük sınıfına ve yaygınlığına göre restorasyon seçin."
};
var DEFAULT_APPROACH = {
	en: "Correlate with clinical findings before deciding on treatment.",
	tr: "Tedaviye karar vermeden önce klinik bulgularla ilişkilendirin."
};
function suggestedApproach(key, lang) {
	if (/^caries\d$/.test(key)) return CARIES_CLASS[lang];
	return (APPROACH[key] ?? DEFAULT_APPROACH)[lang];
}
function reliabilityLabel(value, lang) {
	if (value >= .8) return lang === "tr" ? "Yüksek güvenilirlik" : "High reliability";
	if (value >= .5) return lang === "tr" ? "Orta güvenilirlik" : "Moderate reliability";
	return lang === "tr" ? "Düşük güvenilirlik – doğrulayın" : "Low reliability – verify";
}
var RANK = {
	high: 3,
	medium: 2,
	low: 1
};
function worst(a, b) {
	return a && RANK[a] >= RANK[b] ? a : b;
}
function quadrantFromPosition(positionKey) {
	const upper = /upper/i.test(positionKey);
	const lower = /lower/i.test(positionKey);
	const right = /right/i.test(positionKey);
	const left = /left/i.test(positionKey);
	if (upper === lower || right === left) return null;
	if (upper) return right ? 1 : 2;
	return left ? 3 : 4;
}
function quadrantLabel(q, lang) {
	return `Q${q} · ${(lang === "tr" ? [
		"Üst Sağ",
		"Üst Sol",
		"Alt Sol",
		"Alt Sağ"
	] : [
		"Upper Right",
		"Upper Left",
		"Lower Left",
		"Lower Right"
	])[q - 1]}`;
}
function makeReportId(findings, modality, date) {
	const seed = findings.map((f) => f.id).join("|") + date.toISOString().slice(0, 10);
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = h * 31 + seed.charCodeAt(i) >>> 0;
	return `DV-${date.toISOString().slice(0, 10).replaceAll("-", "")}-${modality === "xray" ? "XR" : "IO"}-${h.toString(36).toUpperCase().padStart(4, "0").slice(0, 5)}`;
}
function impressionText(lang, modality, counts, rows, priority) {
	const tr = lang === "tr";
	const what = modality === "xray" ? tr ? "panoramik radyografide" : "the panoramic radiograph" : tr ? "ağız içi görüntüde" : "the intraoral image";
	if (rows.length === 0) return tr ? `Belirgin bir bulgu tespit edilmedi (${what}).` : `No significant findings were detected in ${what}.`;
	const top = priority[0];
	const where = top.tooth ? `${tr ? "diş" : "tooth"} ${top.tooth}` : top.region;
	const pct = Math.round(top.confidence * 100);
	if (tr) return `${what.charAt(0).toUpperCase()}${what.slice(1)} ${rows.length} bulgu tespit edildi (${counts.high} yüksek, ${counts.medium} orta, ${counts.low} düşük öncelik). En öncelikli bulgu: ${where} – ${top.label} (%${pct}).`;
	return `${rows.length} finding${rows.length > 1 ? "s were" : " was"} detected in ${what} (${counts.high} high, ${counts.medium} medium, ${counts.low} low priority). Highest priority: ${top.label} at ${where} (${pct}%).`;
}
function computeToothMarks(findings) {
	const teeth = /* @__PURE__ */ new Map();
	const quads = /* @__PURE__ */ new Map();
	for (const f of findings) {
		const confirmed = (f.tooth.match(/\b[1-4][1-8]\b/g) ?? []).map(Number);
		const numbers = confirmed.length ? confirmed : (f.toothEst ?? []).map(Number);
		if (numbers.length) for (const n of numbers) {
			const prev = teeth.get(n);
			teeth.set(n, {
				severity: worst(prev?.severity, f.severity),
				estimated: (prev?.estimated ?? true) && confirmed.length === 0,
				count: (prev?.count ?? 0) + 1
			});
		}
		else {
			const q = quadrantFromPosition(f.positionKey);
			if (q) {
				const prev = quads.get(q);
				quads.set(q, {
					severity: worst(prev?.severity, f.severity),
					count: (prev?.count ?? 0) + 1
				});
			}
		}
	}
	return {
		teeth,
		quads
	};
}
function buildReport(opts) {
	const { lang, modality, findings } = opts;
	const tr = lang === "tr";
	const now = opts.now ?? /* @__PURE__ */ new Date();
	const rows = findings.map((f, i) => ({
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
		approach: suggestedApproach(f.key, lang)
	}));
	const counts = {
		high: 0,
		medium: 0,
		low: 0
	};
	rows.forEach((r) => counts[r.severity] += 1);
	const avgConfidence = rows.length ? rows.reduce((s, r) => s + r.confidence, 0) / rows.length : 0;
	const priority = [...rows].sort((a, b) => RANK[b.severity] - RANK[a.severity] || b.confidence - a.confidence);
	const typeMap = /* @__PURE__ */ new Map();
	for (const r of rows) {
		const prev = typeMap.get(r.finding.key);
		typeMap.set(r.finding.key, {
			key: r.finding.key,
			label: r.label,
			colorVar: r.finding.colorVar,
			count: (prev?.count ?? 0) + 1
		});
	}
	const { teeth } = computeToothMarks(findings);
	const quadrantCounts = /* @__PURE__ */ new Map();
	for (const q of [
		1,
		2,
		3,
		4
	]) quadrantCounts.set(q, {
		q,
		label: quadrantLabel(q, lang),
		count: 0,
		severity: null
	});
	for (const r of rows) {
		const first = (r.finding.tooth !== "-" ? r.finding.tooth : r.finding.toothEst?.[0]) ?? "";
		const q = /^[1-4]/.test(first) ? Number(first[0]) : quadrantFromPosition(r.finding.positionKey);
		if (!q) continue;
		const m = quadrantCounts.get(q);
		m.count += 1;
		m.severity = worst(m.severity ?? void 0, r.severity);
	}
	const fusion = fuseFindings(modality === "xray" ? findings : [], modality === "intraoral" ? findings : []);
	const seen = /* @__PURE__ */ new Set();
	const recommendations = [];
	for (const r of priority) {
		if (seen.has(r.finding.key)) continue;
		seen.add(r.finding.key);
		recommendations.push({
			title: r.label,
			text: r.approach
		});
	}
	getRecommendationKeys(fusion).filter((k) => k === "report.rec4").forEach((k) => recommendations.push({
		title: tr ? "Genel" : "General",
		text: t(lang, k)
	}));
	const mio = opts.mio ? {
		label: mioLabel(opts.mio.class_name, lang),
		confidence: opts.mio.confidence,
		probabilities: Object.entries(opts.mio.probabilities ?? {}).map(([k, v]) => ({
			label: mioLabel(k, lang),
			value: v
		})).sort((a, b) => b.value - a.value)
	} : null;
	return {
		lang,
		modality,
		reportId: makeReportId(findings, modality, now),
		generatedAt: now,
		title: modality === "xray" ? tr ? "Panoramik Radyografi Analiz Raporu" : "Panoramic Radiograph Analysis Report" : tr ? "Ağız İçi Analiz Raporu" : "Intraoral Analysis Report",
		studyType: modality === "xray" ? tr ? "Panoramik röntgen" : "Panoramic X-ray" : tr ? "Ağız içi fotoğraf" : "Intraoral photograph",
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
		mio
	};
}
function mioLabel(cls, lang) {
	return {
		healthy: {
			tr: "Sağlıklı",
			en: "Healthy"
		},
		gingivitis: {
			tr: "Gingivitis",
			en: "Gingivitis"
		},
		periodontitis: {
			tr: "Periodontitis",
			en: "Periodontitis"
		}
	}[cls][lang];
}
var A4_W = 595.28;
var A4_H = 841.89;
function jpegToPdf(pages) {
	const encoder = new TextEncoder();
	const objects = [];
	const pushText = (text) => objects.push(encoder.encode(text));
	const pageKids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
	pushText("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
	pushText(`2 0 obj << /Type /Pages /Kids [${pageKids}] /Count ${pages.length} >> endobj\n`);
	for (let i = 0; i < pages.length; i++) {
		const page = pages[i];
		const pageNum = 3 + i * 3;
		const contentNum = pageNum + 1;
		const imageNum = pageNum + 2;
		pushText(`${pageNum} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] /Contents ${contentNum} 0 R /Resources << /XObject << /Im0 ${imageNum} 0 R >> >> >> endobj\n`);
		const stream = `q ${A4_W} 0 0 ${A4_H} 0 0 cm /Im0 Do Q`;
		pushText(`${contentNum} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`);
		pushText(`${imageNum} 0 obj << /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >> stream\n`);
		objects.push(page.jpeg);
		pushText("\nendstream endobj\n");
	}
	const header = encoder.encode("%PDF-1.4\n");
	const chunks = [header];
	const offsets = [0];
	let pos = header.length;
	for (const obj of objects) {
		offsets.push(pos);
		chunks.push(obj);
		pos += obj.length;
	}
	let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (let i = 1; i <= objects.length; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
	xref += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;
	chunks.push(encoder.encode(xref));
	return new Blob(chunks, { type: "application/pdf" });
}
var PW = 794;
var PH = 1123;
var SC = 2;
var MX = 40;
var CW = 714;
var TOP = 84;
var BOTTOM = 1071;
var FONT = "\"Plus Jakarta Sans\", \"Segoe UI\", Arial, sans-serif";
var INK = "#1b2430";
var MUTED = "#5b6b80";
var LINE = "#e3e9f1";
var SOFT = "#f4f7fb";
var PRIMARY = "#2f6fed";
function cssVar(name, fallback) {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function severityColor(s) {
	return cssVar(`--color-${s}`, s === "high" ? "#e11d48" : s === "medium" ? "#d97706" : "#059669");
}
function findingColor(f) {
	return cssVar(f.colorVar, "#e11d48");
}
var Doc = class {
	lang;
	reportId;
	generatedAt;
	pages = [];
	ctx;
	y = TOP;
	constructor(lang, reportId, generatedAt) {
		this.lang = lang;
		this.reportId = reportId;
		this.generatedAt = generatedAt;
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
	ensure(h) {
		if (this.y + h > BOTTOM) this.newPage();
	}
	drawRunningHeader() {
		const { ctx } = this;
		this.rr(MX, 26, 24, 24, 7, PRIMARY);
		this.text("D", 52, 44, {
			size: 15,
			weight: 800,
			color: "#fff",
			align: "center"
		});
		this.text("DentaAI", 74, 40, {
			size: 13,
			weight: 800
		});
		this.text(this.lang === "tr" ? "Akıllı çoklu ortamlı diş teşhis sistemi" : "Multimodal dental diagnosis system", 74, 52, {
			size: 8,
			color: MUTED
		});
		this.text(this.reportId, 754, 40, {
			size: 9,
			weight: 700,
			align: "right"
		});
		this.text(this.generatedAt.toLocaleString(this.lang === "tr" ? "tr-TR" : "en-GB"), 754, 52, {
			size: 8,
			color: MUTED,
			align: "right"
		});
		ctx.strokeStyle = LINE;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(MX, 62);
		ctx.lineTo(754, 62);
		ctx.stroke();
	}
	finish() {
		const total = this.pages.length;
		this.pages.forEach((canvas, i) => {
			const ctx = canvas.getContext("2d");
			this.ctx = ctx;
			ctx.strokeStyle = LINE;
			ctx.beginPath();
			ctx.moveTo(MX, 1085);
			ctx.lineTo(754, 1085);
			ctx.stroke();
			this.text(`DentaAI · ${this.reportId}`, MX, 1101, {
				size: 8,
				color: MUTED
			});
			this.text(`${this.lang === "tr" ? "Sayfa" : "Page"} ${i + 1} / ${total}`, 754, 1101, {
				size: 8,
				color: MUTED,
				align: "right"
			});
		});
	}
	text(str, x, y, o = {}) {
		const { ctx } = this;
		ctx.font = `${o.weight ?? 500} ${o.size ?? 10}px ${FONT}`;
		ctx.fillStyle = o.color ?? INK;
		ctx.textAlign = o.align ?? "left";
		ctx.textBaseline = "alphabetic";
		ctx.fillText(str, x, y);
	}
	lines(str, maxW, o = {}) {
		const { ctx } = this;
		ctx.font = `${o.weight ?? 500} ${o.size ?? 10}px ${FONT}`;
		const out = [];
		let line = "";
		for (const word of str.split(" ")) {
			const test = line ? `${line} ${word}` : word;
			if (line && ctx.measureText(test).width > maxW) {
				out.push(line);
				line = word;
			} else line = test;
		}
		if (line) out.push(line);
		return out;
	}
	paragraph(str, x, y, maxW, lineH, o = {}) {
		const ls = this.lines(str, maxW, o);
		ls.forEach((l, i) => this.text(l, x, y + i * lineH, o));
		return ls.length * lineH;
	}
	rr(x, y, w, h, r, fill, stroke, lw = 1) {
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
	tint(color, alpha, draw) {
		const { ctx } = this;
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.fillStyle = color;
		draw();
		ctx.restore();
	}
	pin(n, x, y, color, r = 8) {
		const { ctx } = this;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 1.5;
		ctx.stroke();
		this.text(String(n), x, y + r * .38, {
			size: r * 1.1,
			weight: 800,
			color: "#fff",
			align: "center"
		});
	}
	sectionTitle(title, subtitle) {
		this.ensure(34);
		this.rr(MX, this.y, 3, 14, 1.5, PRIMARY);
		this.text(title, 50, this.y + 11, {
			size: 12,
			weight: 800
		});
		if (subtitle) this.text(subtitle, 754, this.y + 11, {
			size: 8.5,
			color: MUTED,
			align: "right"
		});
		this.y += 26;
	}
};
function loadImage(src) {
	if (!src) return Promise.resolve(null);
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => resolve(null);
		img.src = src;
	});
}
function drawInfoGrid(doc, model, lang, title, combined) {
	const tr = lang === "tr";
	doc.text(title, MX, doc.y + 18, {
		size: 20,
		weight: 800
	});
	doc.y += 30;
	doc.text(combined ? tr ? "Panoramik röntgen ve ağız içi görüntü analizlerinin birleşik değerlendirmesi" : "Combined evaluation of panoramic X-ray and intraoral image analyses" : tr ? "Yapay zekâ destekli görüntü analizi" : "AI-assisted image analysis", MX, doc.y + 2, {
		size: 10,
		color: MUTED
	});
	doc.y += 18;
	const cells = [
		[tr ? "HASTA ADI" : "PATIENT NAME", null],
		[tr ? "HASTA / PROTOKOL NO" : "PATIENT / PROTOCOL ID", null],
		[tr ? "RAPOR TARİHİ" : "REPORT DATE", model.generatedAt.toLocaleDateString(tr ? "tr-TR" : "en-GB")],
		[tr ? "RAPOR NO" : "REPORT ID", model.reportId],
		[tr ? "TETKİK" : "STUDY", combined ? tr ? "Panoramik röntgen + ağız içi fotoğraf" : "Panoramic X-ray + intraoral photo" : model.studyType],
		[tr ? "SEVK EDEN HEKİM" : "REFERRING CLINICIAN", null]
	];
	const cw = 698 / 3;
	const ch = 38;
	cells.forEach(([label, value], i) => {
		const x = MX + i % 3 * 240.66666666666666;
		const y = doc.y + Math.floor(i / 3) * 46;
		doc.rr(x, y, cw, ch, 8, SOFT);
		doc.text(label, x + 10, y + 14, {
			size: 7,
			weight: 700,
			color: MUTED
		});
		if (value) doc.text(value, x + 10, y + 29, {
			size: 10.5,
			weight: 700
		});
		else {
			doc.ctx.strokeStyle = "#c5cfdc";
			doc.ctx.lineWidth = .8;
			doc.ctx.beginPath();
			doc.ctx.moveTo(x + 10, y + 30);
			doc.ctx.lineTo(x + cw - 10, y + 30);
			doc.ctx.stroke();
		}
	});
	doc.y += 104;
}
function drawSummaryTiles(doc, model, lang) {
	const tr = lang === "tr";
	const tiles = [
		{
			label: tr ? "Toplam bulgu" : "Total findings",
			value: String(model.total),
			color: INK
		},
		{
			label: tr ? "Yüksek öncelik" : "High priority",
			value: String(model.counts.high),
			color: severityColor("high")
		},
		{
			label: tr ? "Orta öncelik" : "Medium priority",
			value: String(model.counts.medium),
			color: severityColor("medium")
		},
		{
			label: tr ? "Düşük öncelik" : "Low priority",
			value: String(model.counts.low),
			color: severityColor("low")
		},
		{
			label: tr ? "Ort. güven" : "Avg. confidence",
			value: `${Math.round(model.avgConfidence * 100)}%`,
			color: PRIMARY
		}
	];
	const w = 682 / 5;
	doc.ensure(64);
	tiles.forEach((tile, i) => {
		const x = MX + i * 144.4;
		doc.rr(x, doc.y, w, 52, 10, "#fff", LINE);
		doc.text(tile.value, x + w / 2, doc.y + 28, {
			size: 20,
			weight: 800,
			color: tile.color,
			align: "center"
		});
		doc.text(tile.label, x + w / 2, doc.y + 43, {
			size: 7.5,
			color: MUTED,
			align: "center"
		});
	});
	doc.y += 66;
}
function drawImpression(doc, model, lang) {
	const tr = lang === "tr";
	const ls = doc.lines(model.impression, 686, { size: 10.5 });
	const h = 34 + ls.length * 15;
	doc.ensure(h + 10);
	doc.rr(MX, doc.y, CW, h, 10, "#eef4ff");
	doc.rr(MX, doc.y, 4, h, 2, PRIMARY);
	doc.text(tr ? "KLİNİK İZLENİM" : "CLINICAL IMPRESSION", 56, doc.y + 18, {
		size: 8,
		weight: 800,
		color: PRIMARY
	});
	ls.forEach((l, i) => doc.text(l, 56, doc.y + 35 + i * 15, { size: 10.5 }));
	doc.y += h + 16;
}
function drawAnnotatedImage(doc, model, img, lang) {
	if (!img) return;
	const tr = lang === "tr";
	const ar = img.naturalHeight / img.naturalWidth;
	const maxH = model.modality === "xray" ? 330 : 380;
	const h = Math.min(maxH, CW * ar);
	const w = h / ar;
	doc.sectionTitle(tr ? "İşaretli görüntü" : "Annotated image", tr ? "Numaralar bulgu listesiyle eşleşir" : "Numbers match the findings list");
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
	const pins = [];
	model.rows.forEach((r) => {
		const f = r.finding;
		const color = findingColor(f);
		ctx.lineWidth = 1.6;
		ctx.strokeStyle = color;
		if (f.mask?.length) {
			ctx.beginPath();
			f.mask.forEach(([mx, my], i) => i ? ctx.lineTo(x + mx * w, y + my * h) : ctx.moveTo(x + mx * w, y + my * h));
			ctx.closePath();
			doc.tint(color, .18, () => ctx.fill());
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
var UPPER = [
	18,
	17,
	16,
	15,
	14,
	13,
	12,
	11,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28
];
var LOWER = [
	48,
	47,
	46,
	45,
	44,
	43,
	42,
	41,
	31,
	32,
	33,
	34,
	35,
	36,
	37,
	38
];
var WIDTH = [
	0,
	14,
	12,
	13,
	12,
	12,
	17,
	17,
	16
];
function drawDentalChart(doc, model, lang) {
	const tr = lang === "tr";
	const SLOT = 18.4;
	const MID = 10;
	const PAD = 12;
	const chartW = 328.4;
	const k = 1.18;
	doc.sectionTitle(tr ? "Diş şeması (FDI)" : "Dental chart (FDI)");
	doc.ensure(208.44);
	const y0 = doc.y;
	const { ctx } = doc;
	doc.rr(MX, y0 - 4, 403.51199999999994, 198.44, 10, "#fff", LINE);
	ctx.save();
	ctx.translate(48, y0);
	ctx.scale(k, k);
	const toothX = (i) => PAD + i * SLOT + (i >= 8 ? MID : 0);
	const draw = (numbers, upper) => numbers.forEach((fdi, i) => {
		const mark = model.teethMarks.get(fdi);
		const w = WIDTH[i < 8 ? 8 - i : i - 7];
		const x = toothX(i) + (SLOT - w) / 2;
		const y = upper ? 20 : 92;
		const crownH = 44 * .52;
		const crownY = upper ? y + 44 - crownH : y;
		const rootBase = upper ? crownY : crownY + crownH;
		const rootTip = upper ? y : y + 44;
		const color = mark ? severityColor(mark.severity) : null;
		ctx.beginPath();
		ctx.moveTo(x + w * .2, rootBase);
		ctx.lineTo(x + w * .5, rootTip);
		ctx.lineTo(x + w * .8, rootBase);
		ctx.closePath();
		ctx.fillStyle = "#f1f5f9";
		ctx.fill();
		if (color) doc.tint(color, .28, () => ctx.fill());
		ctx.strokeStyle = color ?? "#cbd5e1";
		ctx.lineWidth = .8;
		ctx.stroke();
		doc.rr(x, crownY, w, crownH, 4, "#f8fafc");
		if (color) doc.tint(color, .5, () => {
			doc.rr(x, crownY, w, crownH, 4);
			ctx.fill();
		});
		ctx.setLineDash(mark?.estimated ? [2.5, 1.8] : []);
		doc.rr(x, crownY, w, crownH, 4, void 0, color ?? "#cbd5e1", 1);
		ctx.setLineDash([]);
		doc.text(String(fdi), x + w / 2, upper ? 14 : 148, {
			size: 7.5,
			weight: mark ? 800 : 500,
			color: mark ? INK : MUTED,
			align: "center"
		});
	});
	draw(UPPER, true);
	draw(LOWER, false);
	ctx.strokeStyle = "#e2e8f0";
	ctx.lineWidth = .8;
	ctx.setLineDash([3, 3]);
	ctx.beginPath();
	ctx.moveTo(PAD, 79);
	ctx.lineTo(316.4, 79);
	ctx.moveTo(chartW / 2, 14);
	ctx.lineTo(chartW / 2, 150);
	ctx.stroke();
	ctx.setLineDash([]);
	doc.text("R", 4, 86, {
		size: 8,
		weight: 800,
		color: MUTED
	});
	doc.text("L", 324.4, 86, {
		size: 8,
		weight: 800,
		color: MUTED,
		align: "right"
	});
	ctx.restore();
	const rx = 461.51199999999994;
	let ry = y0 + 12;
	[
		"high",
		"medium",
		"low"
	].forEach((s) => {
		doc.ctx.beginPath();
		doc.ctx.arc(465.51199999999994, ry - 3, 3.5, 0, Math.PI * 2);
		doc.ctx.fillStyle = severityColor(s);
		doc.ctx.fill();
		doc.text(s === "high" ? tr ? "Yüksek öncelik" : "High priority" : s === "medium" ? tr ? "Orta öncelik" : "Medium priority" : tr ? "Düşük öncelik" : "Low priority", 475.51199999999994, ry, { size: 9 });
		ry += 15;
	});
	ry += 8;
	doc.text(tr ? "KADRAN DAĞILIMI" : "QUADRANT DISTRIBUTION", rx, ry, {
		size: 7.5,
		weight: 800,
		color: MUTED
	});
	ry += 14;
	model.quadrants.forEach((q) => {
		doc.text(q.label, rx, ry, {
			size: 9,
			color: q.count ? INK : MUTED
		});
		doc.text(String(q.count), 746, ry, {
			size: 9,
			weight: 800,
			color: q.count ? INK : MUTED,
			align: "right"
		});
		ry += 15;
	});
	if (model.hasEstimatedTeeth) doc.paragraph(tr ? "≈ Kesikli çizgili dişler: numara kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)." : "≈ Dashed teeth: numbers are estimated from arch geometry (not model output).", rx, ry + 6, 284.48800000000006, 11, {
		size: 8,
		color: MUTED
	});
	doc.y += 206.44;
}
function drawFindingCard(doc, row, img, lang) {
	const tr = lang === "tr";
	const thumbW = img ? 112 : 0;
	const thumbH = 84;
	const padding = 12;
	const textX = 52 + (img ? thumbW + 14 : 0);
	const textW = 742 - textX;
	const title = `${row.tooth ? `${tr ? "Diş" : "Tooth"} ${row.tooth} – ` : ""}${row.label}`;
	const descLines = doc.lines(row.description, textW, { size: 9.5 });
	const approachLines = doc.lines(row.approach, textW - 12, { size: 9.5 });
	const textH = 46 + descLines.length * 13 + 8 + 14 + approachLines.length * 13 + 6;
	const h = Math.max(108, textH + 24 - 6);
	doc.ensure(h + 10);
	const y = doc.y;
	const color = findingColor(row.finding);
	doc.rr(MX, y, CW, h, 10, "#fff", LINE);
	doc.rr(MX, y, 4, h, 2, severityColor(row.severity));
	if (img) {
		const tx = 54;
		const ty = y + padding;
		const [x1, y1, x2, y2] = row.finding.bbox;
		const iw = img.naturalWidth;
		const ih = img.naturalHeight;
		const bw = (x2 - x1) * iw;
		const bh = (y2 - y1) * ih;
		const padX = Math.max(bw * .45, iw * .02);
		const padY = Math.max(bh * .45, ih * .02);
		let sx = Math.max(0, x1 * iw - padX);
		let sy = Math.max(0, y1 * ih - padY);
		let sw = Math.min(iw - sx, bw + padX * 2);
		let sh = Math.min(ih - sy, bh + padY * 2);
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
		doc.rr(tx, ty, thumbW, thumbH, 8, void 0, LINE);
		doc.pin(row.n, 56, ty + 2, color, 9);
	} else doc.pin(row.n, 60, y + padding + 8, color, 9);
	const tx0 = img ? textX : textX + 24;
	let cy = y + padding + 12;
	doc.text(title, tx0, cy, {
		size: 11.5,
		weight: 800
	});
	const pct = `${Math.round(row.confidence * 100)}%`;
	doc.text(pct, 742, cy, {
		size: 11.5,
		weight: 800,
		align: "right"
	});
	doc.ctx.font = `800 8.5px ${FONT}`;
	const pillW = doc.ctx.measureText(row.severityText).width + 18;
	const pillX = 704 - pillW;
	doc.tint(severityColor(row.severity), .14, () => {
		doc.rr(pillX, cy - 11, pillW, 15, 7.5);
		doc.ctx.fill();
	});
	doc.text(row.severityText, pillX + pillW / 2, cy, {
		size: 8.5,
		weight: 800,
		color: severityColor(row.severity),
		align: "center"
	});
	cy += 13;
	doc.text(row.region, tx0, cy, {
		size: 9,
		color: MUTED
	});
	cy += 9;
	const barW = textW - (img ? 0 : 24);
	doc.rr(tx0, cy, barW, 4, 2, "#e8eef6");
	doc.rr(tx0, cy, Math.max(4, barW * row.confidence), 4, 2, color);
	cy += 18;
	descLines.forEach((l, i) => doc.text(l, tx0, cy + i * 13, {
		size: 9.5,
		color: "#33415a"
	}));
	cy += descLines.length * 13 + 6;
	doc.text(tr ? "Önerilen yaklaşım" : "Suggested approach", tx0, cy, {
		size: 8.5,
		weight: 800,
		color: PRIMARY
	});
	cy += 13;
	approachLines.forEach((l, i) => doc.text(l, tx0, cy + i * 13, {
		size: 9.5,
		color: MUTED
	}));
	doc.y += h + 8;
}
function drawMio(doc, model, lang) {
	if (!model.mio) return;
	const tr = lang === "tr";
	doc.sectionTitle(tr ? "MIO — Diş eti / periodontal sınıflama" : "MIO — gingival / periodontal classification");
	const h = 28 + model.mio.probabilities.length * 18 + 8;
	doc.ensure(h + 10);
	doc.rr(MX, doc.y, CW, h, 10, SOFT);
	doc.text(`${model.mio.label}  ·  ${(model.mio.confidence * 100).toFixed(1)}%`, 54, doc.y + 20, {
		size: 11,
		weight: 800
	});
	model.mio.probabilities.forEach((p, i) => {
		const yy = doc.y + 40 + i * 18;
		doc.text(p.label, 54, yy, {
			size: 9,
			color: MUTED
		});
		doc.rr(160, yy - 8, 514, 6, 3, "#dfe7f2");
		doc.rr(160, yy - 8, Math.max(4, 514 * p.value), 6, 3, PRIMARY);
		doc.text(`${Math.round(p.value * 100)}%`, 740, yy, {
			size: 9,
			weight: 700,
			align: "right"
		});
	});
	doc.y += h + 14;
}
function drawRecommendations(doc, models, lang) {
	const tr = lang === "tr";
	const seen = /* @__PURE__ */ new Set();
	const items = models.flatMap((m) => m.recommendations).filter((r) => {
		const key = `${r.title}|${r.text}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	if (items.length === 0) return;
	doc.sectionTitle(tr ? "Öneriler" : "Recommendations");
	items.forEach((r, i) => {
		const ls = doc.lines(r.text, 674, { size: 9.5 });
		const h = 22 + ls.length * 13;
		doc.ensure(h + 6);
		doc.rr(MX, doc.y, CW, h, 8, SOFT);
		doc.pin(i + 1, 56, doc.y + 15, PRIMARY, 8);
		doc.text(r.title, 72, doc.y + 17, {
			size: 10,
			weight: 800
		});
		ls.forEach((l, j) => doc.text(l, 72, doc.y + 31 + j * 13, {
			size: 9.5,
			color: MUTED
		}));
		doc.y += h + 6;
	});
	doc.y += 8;
}
function drawSignature(doc, lang) {
	const tr = lang === "tr";
	doc.ensure(96);
	doc.y += 10;
	const colW = 230;
	[
		tr ? "Raporu değerlendiren hekim" : "Reviewing clinician",
		tr ? "İmza / Kaşe" : "Signature / Stamp",
		tr ? "Tarih" : "Date"
	].forEach((label, i) => {
		const x = MX + i * 242;
		doc.ctx.strokeStyle = "#9fb0c6";
		doc.ctx.lineWidth = .9;
		doc.ctx.beginPath();
		doc.ctx.moveTo(x, doc.y + 40);
		doc.ctx.lineTo(x + colW, doc.y + 40);
		doc.ctx.stroke();
		doc.text(label, x, doc.y + 54, {
			size: 8.5,
			color: MUTED
		});
	});
	doc.y += 70;
}
function drawCombinedOverview(doc, fusion, lang) {
	const tr = lang === "tr";
	doc.sectionTitle(tr ? "Genel durum" : "Overall status");
	const overall = t(lang, `report.${fusion.overallKey === "low" ? "lowRisk" : fusion.overallKey}`);
	const note = t(lang, `report.${fusion.noteKey}`);
	const ls = doc.lines(`${overall} — ${note}`, 686, {
		size: 10.5,
		weight: 700
	});
	const h = 46 + ls.length * 15;
	doc.ensure(h + 10);
	doc.rr(MX, doc.y, CW, h, 10, "#eef4ff");
	doc.rr(MX, doc.y, 4, h, 2, PRIMARY);
	ls.forEach((l, i) => doc.text(l, 56, doc.y + 22 + i * 15, {
		size: 10.5,
		weight: 700
	}));
	doc.text(`${t(lang, "report.xrayCard")}: ${fusion.xrayCount}   ·   ${t(lang, "report.intraCard")}: ${fusion.intraCount}   ·   ${t(lang, "report.sharedCard")}: ${fusion.sharedCount}`, 56, doc.y + h - 12, {
		size: 9,
		color: MUTED
	});
	doc.y += h + 16;
}
async function downloadReportPdf(opts) {
	const { lang, fusion, reportType } = opts;
	const tr = lang === "tr";
	const state = useApp.getState();
	try {
		await document.fonts?.load(`700 12px "Plus Jakarta Sans"`);
		await document.fonts?.load(`500 12px "Plus Jakarta Sans"`);
	} catch {}
	const sections = [];
	if (reportType === "xray" || reportType === "combined") {
		const model = buildReport({
			lang,
			modality: "xray",
			findings: opts.xray
		});
		sections.push({
			model,
			img: await loadImage(opts.xrayImage ?? state.xrayImage)
		});
	}
	if (reportType === "intraoral" || reportType === "combined") {
		const model = buildReport({
			lang,
			modality: "intraoral",
			findings: opts.intraoral,
			mio: state.mioClassification
		});
		sections.push({
			model,
			img: await loadImage(opts.intraoralImage ?? state.intraoralImage)
		});
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
			doc.text(model.title, 54, doc.y + 17, {
				size: 11.5,
				weight: 800,
				color: "#fff"
			});
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
	const pages = [];
	for (const canvas of doc.pages) {
		const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .92));
		if (!blob) continue;
		pages.push({
			jpeg: new Uint8Array(await blob.arrayBuffer()),
			width: canvas.width,
			height: canvas.height
		});
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
	}, 1e3);
}
var GAP = 3;
var MARGIN = 2;
var PIN_SIZE = 18;
var HOVER_RELEASE_MS = 140;
function overlapArea(a, b, margin = 0) {
	const ox = Math.min(a.left + a.w, b.left + b.w) - Math.max(a.left, b.left) + margin;
	const oy = Math.min(a.top + a.h, b.top + b.h) - Math.max(a.top, b.top) + margin;
	return ox > 0 && oy > 0 ? ox * oy : 0;
}
function clampRect(left, top, size, container) {
	return {
		left: Math.min(Math.max(0, left), Math.max(0, container.w - size.w)),
		top: Math.min(Math.max(0, top), Math.max(0, container.h - size.h)),
		w: size.w,
		h: size.h
	};
}
function placeNearBoxes(findings, sizeOf, container, priorityId) {
	const placed = [];
	const result = {};
	const order = [...findings].sort((a, b) => Number(b.id === priorityId) - Number(a.id === priorityId));
	for (const f of order) {
		const size = sizeOf(f);
		if (!size) continue;
		const { w, h } = size;
		const [bx1, by1, bx2, by2] = f.bbox;
		const x1 = bx1 * container.w;
		const y1 = by1 * container.h;
		const x2 = bx2 * container.w;
		const y2 = by2 * container.h;
		const candidates = [
			[x1, y1 - h - GAP],
			[x2 - w, y1 - h - GAP],
			[x1 - w, y1 - h - GAP],
			[x2 + GAP, y1],
			[x1 - w - GAP, y1],
			[x1, y2 + GAP],
			[x2 - w, y2 + GAP],
			[x1 - w, y2 + GAP],
			[x1, y1 - 2 * h - GAP - MARGIN],
			[x1, y1 - 3 * h - GAP - 4]
		];
		let best = null;
		let bestScore = Infinity;
		for (const [cx, cy] of candidates) {
			const rect = clampRect(cx, cy, size, container);
			const score = placed.reduce((sum, p) => sum + overlapArea(rect, p, MARGIN), 0);
			if (score < bestScore) {
				best = rect;
				bestScore = score;
				if (score === 0) break;
			}
		}
		if (best) {
			placed.push(best);
			result[f.id] = {
				left: best.left,
				top: best.top
			};
		}
	}
	return result;
}
function FindingOverlay({ findings: allFindings, hiddenIds, lang, compact = false, selectedId, onSelect }) {
	const findings = (0, import_react.useMemo)(() => hiddenIds?.length ? allFindings.filter((f) => !hiddenIds.includes(f.id)) : allFindings, [allFindings, hiddenIds]);
	const rootRef = (0, import_react.useRef)(null);
	const labelRefs = (0, import_react.useRef)({});
	const releaseTimer = (0, import_react.useRef)(null);
	const [container, setContainer] = (0, import_react.useState)(null);
	const [sizes, setSizes] = (0, import_react.useState)({});
	const [hoveredId, setHoveredId] = (0, import_react.useState)(null);
	const [showAll, setShowAll] = (0, import_react.useState)(false);
	const hover = (0, import_react.useCallback)((id) => {
		if (releaseTimer.current) clearTimeout(releaseTimer.current);
		setHoveredId(id);
	}, []);
	const release = (0, import_react.useCallback)(() => {
		if (releaseTimer.current) clearTimeout(releaseTimer.current);
		releaseTimer.current = setTimeout(() => setHoveredId(null), HOVER_RELEASE_MS);
	}, []);
	(0, import_react.useEffect)(() => () => {
		if (releaseTimer.current) clearTimeout(releaseTimer.current);
	}, []);
	(0, import_react.useLayoutEffect)(() => {
		const el = rootRef.current;
		if (!el) return;
		const update = () => {
			const w = el.clientWidth;
			const h = el.clientHeight;
			setContainer((prev) => prev && prev.w === w && prev.h === h ? prev : {
				w,
				h
			});
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	(0, import_react.useLayoutEffect)(() => {
		const next = {};
		let changed = false;
		for (const f of findings) {
			const el = labelRefs.current[f.id];
			if (!el) continue;
			const size = {
				w: el.offsetWidth,
				h: el.offsetHeight
			};
			next[f.id] = size;
			const prev = sizes[f.id];
			if (!prev || prev.w !== size.w || prev.h !== size.h) changed = true;
		}
		if (changed) setSizes(next);
	});
	const focusId = hoveredId ?? selectedId ?? null;
	const pinPositions = (0, import_react.useMemo)(() => container ? placeNearBoxes(findings, () => ({
		w: PIN_SIZE,
		h: PIN_SIZE
	}), container, selectedId) : {}, [
		findings,
		container,
		selectedId
	]);
	const labelPositions = (0, import_react.useMemo)(() => container ? placeNearBoxes(findings, (f) => sizes[f.id], container, focusId) : {}, [
		findings,
		sizes,
		container,
		focusId
	]);
	const expandedPos = (id) => {
		const pin = pinPositions[id];
		const size = sizes[id];
		if (!pin || !size || !container) return void 0;
		const r = clampRect(pin.left, pin.top, size, container);
		return {
			left: r.left,
			top: r.top
		};
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "pointer-events-none absolute inset-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			className: "absolute inset-0 size-full",
			viewBox: "0 0 100 100",
			preserveAspectRatio: "none",
			children: findings.map((f) => {
				const active = focusId === f.id;
				const dimmed = !compact && hoveredId !== null && hoveredId !== f.id;
				const interaction = {
					onClick: () => onSelect?.(f.id),
					onPointerEnter: () => hover(f.id),
					onPointerLeave: release
				};
				if (f.mask && f.mask.length > 0) {
					const points = f.mask.map(([x, y]) => `${x * 100} ${y * 100}`).join(" ");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
						style: {
							opacity: dimmed ? .35 : 1,
							transition: "opacity 150ms"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
							points,
							fill: `var(${f.colorVar})`,
							fillOpacity: active ? "0.25" : "0.15",
							stroke: `var(${f.colorVar})`,
							strokeWidth: "0.8",
							className: cn(!compact && "pointer-events-auto cursor-pointer", active && "stroke-[1.0]"),
							...compact ? {} : interaction
						})
					}, f.id);
				}
				const [x1, y1, x2, y2] = f.bbox;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					style: {
						opacity: dimmed ? .35 : 1,
						transition: "opacity 150ms"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: `${x1 * 100}%`,
						y: `${y1 * 100}%`,
						width: `${(x2 - x1) * 100}%`,
						height: `${(y2 - y1) * 100}%`,
						fill: "transparent",
						stroke: `var(${f.colorVar})`,
						strokeWidth: "0.8",
						className: cn("rounded-sm", !compact && "pointer-events-auto cursor-pointer", active && "stroke-[1.0]"),
						...compact ? {} : interaction
					})
				}, f.id);
			})
		}), !compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-0 pointer-events-none",
			children: [findings.map((f) => {
				const index = allFindings.indexOf(f);
				const active = hoveredId === f.id;
				const selected = selectedId === f.id;
				const expanded = showAll || active;
				const pos = showAll ? labelPositions[f.id] : active ? expandedPos(f.id) : void 0;
				const pin = pinPositions[f.id];
				const dimmed = hoveredId !== null && !active;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: (el) => {
						labelRefs.current[f.id] = el;
					},
					className: "pointer-events-auto absolute inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-medium text-white",
					style: {
						left: pos?.left ?? 0,
						top: pos?.top ?? 0,
						visibility: expanded && pos ? "visible" : "hidden",
						zIndex: active ? 30 : 10,
						backgroundColor: `var(${f.colorVar})`,
						opacity: dimmed && showAll ? .55 : active ? 1 : .92,
						boxShadow: active ? "0 2px 6px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.15)"
					},
					onClick: () => onSelect?.(f.id),
					onPointerEnter: () => hover(f.id),
					onPointerLeave: release,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-3.5 place-items-center rounded-full bg-white/25 text-[9px] font-bold",
							children: index + 1
						}),
						toothDisplay(f) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: toothDisplay(f) }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: findingLabel(lang, f.key) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.round(f.confidence * 100), "%"] })
					]
				}), !showAll && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `${index + 1}. ${findingLabel(lang, f.key)}`,
					className: "pointer-events-auto absolute grid cursor-pointer place-items-center rounded-full text-[10px] font-bold leading-none text-white ring-[1.5px] ring-white transition duration-150",
					style: {
						width: PIN_SIZE,
						height: PIN_SIZE,
						left: pin?.left ?? 0,
						top: pin?.top ?? 0,
						visibility: pin && !active ? "visible" : "hidden",
						zIndex: 20,
						backgroundColor: `var(${f.colorVar})`,
						opacity: dimmed ? .6 : 1,
						transform: selected ? "scale(1.25)" : void 0,
						boxShadow: selected ? `0 0 0 4px color-mix(in oklab, var(${f.colorVar}) 35%, transparent), 0 2px 6px rgba(0,0,0,0.5)` : "0 1px 3px rgba(0,0,0,0.45)"
					},
					onClick: () => onSelect?.(f.id),
					onPointerEnter: () => hover(f.id),
					onPointerLeave: release,
					onFocus: () => hover(f.id),
					onBlur: release,
					children: index + 1
				})] }, f.id);
			}), findings.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				title: showAll ? "Pin" : "Labels",
				"aria-pressed": showAll,
				className: cn("pointer-events-auto absolute left-2 top-2 z-40 inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white backdrop-blur transition-colors", showAll ? "bg-primary" : "bg-black/55 hover:bg-black/75"),
				onClick: () => setShowAll((v) => !v),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "size-3" }), findings.length]
			})]
		})]
	});
}
//#endregion
export { suggestedApproach as a, reliabilityLabel as i, buildReport as n, downloadReportPdf as r, FindingOverlay as t };
