import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as findingLabel, d as useApp, i as findingDesc, l as t, n as cn, o as isToothEstimated, r as fileToDataUrl, s as positionLabel, t as Button, u as toothDisplay } from "./store-98_nkWXH.mjs";
import { n as ToothMark } from "./logo-C1uit8IC.mjs";
import { A as Expand, C as Images, D as FileText, E as FlipHorizontal, I as ChevronRight, M as Crop, N as Contrast, O as Eye, P as ClipboardList, R as CalendarDays, _ as Maximize2, a as SunMedium, b as Lightbulb, c as ShieldAlert, d as ScanSearch, f as RotateCcw, h as Minus, j as Download, k as EyeOff, n as Upload, o as Stethoscope, p as Plus, v as LoaderCircle, z as Brain } from "../_libs/lucide-react.mjs";
import { n as ConfidenceRing, r as fuseFindings, t as Badge } from "./fusion-BQBcjWco.mjs";
import { a as suggestedApproach, i as reliabilityLabel, n as buildReport, r as downloadReportPdf, t as FindingOverlay } from "./finding-overlay-BkfSyVFw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/image-workspace-C-mgb5on.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SEVERITIES = [
	"high",
	"medium",
	"low"
];
var SEVERITY_TEXT = {
	high: {
		tr: "Yüksek",
		en: "High"
	},
	medium: {
		tr: "Orta",
		en: "Medium"
	},
	low: {
		tr: "Düşük",
		en: "Low"
	}
};
var SEVERITY_BG = {
	high: "bg-high",
	medium: "bg-medium",
	low: "bg-low"
};
function FindingsSummary({ findings }) {
	const lang = useApp((s) => s.language);
	const selectedId = useApp((s) => s.selectedFindingId);
	const select = useApp((s) => s.setSelectedFindingId);
	const tr = lang === "tr";
	if (findings.length === 0) return null;
	const bySeverity = SEVERITIES.map((s) => ({
		severity: s,
		items: findings.filter((f) => f.severity === s)
	}));
	const avg = findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length;
	const urgent = bySeverity[0].items.length;
	const selectedKey = findings.find((f) => f.id === selectedId)?.key;
	const groups = Array.from(findings.reduce((map, f) => {
		const g = map.get(f.key) ?? [];
		g.push(f);
		return map.set(f.key, g);
	}, /* @__PURE__ */ new Map())).sort((a, b) => b[1].length - a[1].length);
	const jumpTo = (items) => {
		const i = items.findIndex((f) => f.id === selectedId);
		select(items[(i + 1) % items.length].id);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": tr ? "Bulgu özeti" : "Findings summary",
		className: "card-surface flex flex-col gap-4 rounded-2xl p-4 lg:flex-row lg:items-center lg:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4 lg:w-52 lg:shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-4xl font-bold leading-none tabular-nums",
					children: findings.length
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-xs leading-snug text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-foreground",
						children: tr ? "Tespit edilen bulgu" : "Findings detected"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						tr ? "Ort. güven" : "Avg. confidence",
						" ",
						Math.round(avg * 100),
						"%"
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 lg:w-72 lg:shrink-0 lg:border-l lg:border-border/70 lg:pl-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: tr ? "Öncelik dağılımı" : "Priority"
						}), urgent > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-semibold text-high",
							children: [
								urgent,
								" ",
								tr ? "acil inceleme" : "need review"
							]
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-secondary",
						children: bySeverity.map(({ severity, items }) => items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: SEVERITY_BG[severity],
							style: { flexGrow: items.length },
							title: `${SEVERITY_TEXT[severity][lang]}: ${items.length}`
						}, severity) : null)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-x-3 gap-y-1",
						children: bySeverity.map(({ severity, items }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: items.length === 0,
							onClick: () => jumpTo(items),
							className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors enabled:hover:text-foreground disabled:opacity-40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", SEVERITY_BG[severity]) }),
								SEVERITY_TEXT[severity][lang],
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold tabular-nums text-foreground",
									children: items.length
								})
							]
						}, severity))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1 lg:border-l lg:border-border/70 lg:pl-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-xs font-semibold",
					children: tr ? "Bulgu türleri" : "Finding types"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: groups.map(([key, items]) => {
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => jumpTo(items),
							className: cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", selectedKey === key ? "border-primary/40 bg-accent text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-2 rounded-full",
									style: { background: `var(${items[0].colorVar})` }
								}),
								findingLabel(lang, key),
								items.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-semibold tabular-nums text-foreground",
									children: ["×", items.length]
								}) : null
							]
						}, key);
					})
				})]
			})
		]
	});
}
function FindingDetails({ finding, lang, modality }) {
	const tr = lang === "tr";
	const [x1, y1, x2, y2] = finding.bbox;
	const areaPct = Math.max(0, (x2 - x1) * (y2 - y1) * 100);
	const action = suggestedApproach(finding.key, lang);
	const source = modality === "xray" ? tr ? "Panoramik röntgen" : "Panoramic X-ray" : tr ? "Ağız içi fotoğraf" : "Intraoral photo";
	const outline = finding.mask?.length ? tr ? "Segmentasyon maskesi" : "Segmentation mask" : tr ? "Sınırlayıcı kutu" : "Bounding box";
	const rows = [
		[t(lang, "common.toothNo"), toothDisplay(finding) ?? "—"],
		[tr ? "Bölge" : "Region", positionLabel(lang, finding.positionKey)],
		[tr ? "Kaynak" : "Source", source],
		[tr ? "Kapsanan alan" : "Covered area", `${areaPct.toFixed(1)}%`],
		[tr ? "Sınırlama" : "Outline", outline]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "finding-card-in space-y-3 px-3 pb-3 pt-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceRing, {
					value: finding.confidence,
					colorVar: finding.colorVar,
					size: 52
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: reliabilityLabel(finding.confidence, lang)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "divide-y divide-border/60 rounded-lg border border-border/60 text-xs",
				children: rows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 px-3 py-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted-foreground",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "text-right font-medium",
						children: value
					})]
				}, label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg px-3 py-2 text-xs leading-relaxed",
				style: { background: `color-mix(in oklab, var(${finding.colorVar}) 9%, white)` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-0.5 font-semibold",
					children: tr ? "Önerilen yaklaşım" : "Suggested approach"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-foreground/80",
					children: action
				})]
			}),
			isToothEstimated(finding) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex gap-1.5 text-[11px] leading-snug text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-px size-3 shrink-0" }), tr ? "≈ Diş numarası, kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)." : "≈ Tooth number is estimated from arch geometry (not model output)."]
			}) : null
		]
	});
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
var SLOT = 18.4;
var MID_GAP = 10;
var PAD = 12;
var CHART_W = 328.4;
var TOOTH_H = 44;
var UPPER_Y = 20;
var LOWER_Y = 92;
var RANK = {
	high: 3,
	medium: 2,
	low: 1
};
var SEV_VAR = {
	high: "var(--color-high)",
	medium: "var(--color-medium)",
	low: "var(--color-low)"
};
function worst(a, b) {
	return a && RANK[a] >= RANK[b] ? a : b;
}
function add(map, key, f, estimated = false) {
	const prev = map.get(key);
	map.set(key, {
		severity: worst(prev?.severity, f.severity),
		ids: [...prev?.ids ?? [], f.id],
		estimated: (prev?.estimated ?? true) && estimated
	});
}
function quadrantOf(positionKey) {
	const upper = /upper/i.test(positionKey);
	const lower = /lower/i.test(positionKey);
	const right = /right/i.test(positionKey);
	const left = /left/i.test(positionKey);
	if (upper === lower || right === left) return null;
	if (upper) return right ? 1 : 2;
	return left ? 3 : 4;
}
function toothX(i) {
	return PAD + i * SLOT + (i >= 8 ? MID_GAP : 0);
}
function Tooth({ fdi, index, upper, mark, selected, onClick, title }) {
	const w = WIDTH[index < 8 ? 8 - index : index - 7];
	const x = toothX(index) + (SLOT - w) / 2;
	const y = upper ? UPPER_Y : LOWER_Y;
	const crownH = TOOTH_H * .52;
	const crownY = upper ? y + TOOTH_H - crownH : y;
	const rootBase = upper ? crownY : crownY + crownH;
	const rootTip = upper ? y : y + TOOTH_H;
	const color = mark ? SEV_VAR[mark.severity] : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		className: cn(mark ? "cursor-pointer" : "pointer-events-none"),
		onClick: mark ? onClick : void 0,
		role: mark ? "button" : void 0,
		"aria-label": mark ? title : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: `M ${x + w * .2} ${rootBase} L ${x + w * .5} ${rootTip} L ${x + w * .8} ${rootBase} Z`,
				fill: color ? `color-mix(in oklab, ${color} 22%, white)` : "#f1f5f9",
				stroke: color ?? "#cbd5e1",
				strokeWidth: .8,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x,
				y: crownY,
				width: w,
				height: crownH,
				rx: 4,
				fill: color ? `color-mix(in oklab, ${color} 55%, white)` : "#f8fafc",
				stroke: color ?? "#cbd5e1",
				strokeWidth: selected ? 2 : 1,
				strokeDasharray: mark?.estimated ? "2.5 1.8" : void 0
			}),
			selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: x - 2,
				y: crownY - 2,
				width: w + 4,
				height: 26.880000000000003,
				rx: 6,
				fill: "none",
				stroke: color,
				strokeOpacity: .45,
				strokeWidth: 2
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: x + w / 2,
				y: upper ? 14 : 148,
				textAnchor: "middle",
				className: cn("select-none", mark ? "fill-foreground font-bold" : "fill-muted-foreground"),
				style: { fontSize: 8 },
				children: fdi
			})
		]
	});
}
function QuadrantPanel({ q, region, selected, title, onClick }) {
	const upper = q <= 2;
	const right = q === 1 || q === 4;
	const x1 = right ? 8 : toothX(8) - 4;
	const x2 = right ? toothX(7) + SLOT + 4 : toothX(15) + SLOT + 4;
	const y1 = upper ? 6 : 88;
	const y2 = upper ? 68 : 152;
	const color = SEV_VAR[region.severity];
	const bx = right ? x1 : x2;
	const by = upper ? y1 : y2;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		className: "cursor-pointer",
		onClick,
		role: "button",
		"aria-label": title,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: title }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: x1,
				y: y1,
				width: x2 - x1,
				height: y2 - y1,
				rx: 8,
				fill: `color-mix(in oklab, ${color} ${selected ? 20 : 11}%, white)`,
				stroke: color,
				strokeOpacity: selected ? .9 : .45,
				strokeWidth: selected ? 1.6 : 1,
				strokeDasharray: selected ? void 0 : "3 2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: bx,
				cy: by,
				r: 7.5,
				fill: color,
				stroke: "white",
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: bx,
				y: by + 3,
				textAnchor: "middle",
				className: "select-none fill-white",
				style: {
					fontSize: 9,
					fontWeight: 700
				},
				children: region.ids.length
			})
		]
	});
}
function DentalChart({ findings, tr }) {
	const selectedId = useApp((s) => s.selectedFindingId);
	const select = useApp((s) => s.setSelectedFindingId);
	if (findings.length === 0) return null;
	const teeth = /* @__PURE__ */ new Map();
	const quads = /* @__PURE__ */ new Map();
	for (const f of findings) {
		const confirmed = (f.tooth.match(/\b[1-4][1-8]\b/g) ?? []).map(Number);
		const numbers = confirmed.length ? confirmed : (f.toothEst ?? []).map(Number);
		if (numbers.length) numbers.forEach((n) => add(teeth, n, f, confirmed.length === 0));
		else {
			const q = quadrantOf(f.positionKey);
			if (q) add(quads, q, f);
		}
	}
	const selectedFinding = findings.find((f) => f.id === selectedId);
	const jump = (ids) => {
		const i = ids.indexOf(selectedId ?? "");
		select(ids[(i + 1) % ids.length]);
	};
	const sevLabel = (s) => s === "high" ? tr ? "Yüksek" : "High" : s === "medium" ? tr ? "Orta" : "Medium" : tr ? "Düşük" : "Low";
	const row = (numbers, upper) => numbers.map((fdi, i) => {
		const mark = teeth.get(fdi);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooth, {
			fdi,
			index: i,
			upper,
			mark,
			selected: Boolean(mark && selectedFinding && mark.ids.includes(selectedFinding.id)),
			onClick: () => mark && jump(mark.ids),
			title: mark ? `${mark.estimated ? "≈" : ""}${fdi} · ${mark.ids.length} ${tr ? "bulgu" : "finding(s)"}` : String(fdi)
		}, fdi);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 rounded-xl border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold",
					children: tr ? "Diş şeması (FDI)" : "Dental chart (FDI)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2 text-[10px] text-muted-foreground",
					children: [
						"high",
						"medium",
						"low"
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-1.5 rounded-full",
							style: { background: SEV_VAR[s] }
						}), sevLabel(s)]
					}, s))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: `0 0 ${CHART_W} 158`,
				className: "w-full",
				role: "group",
				"aria-label": "FDI dental chart",
				children: [
					[
						1,
						2,
						3,
						4
					].map((q) => {
						const region = quads.get(q);
						if (!region) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuadrantPanel, {
							q,
							region,
							selected: Boolean(selectedFinding && region.ids.includes(selectedFinding.id)),
							title: `Q${q} · ${region.ids.length} ${tr ? "bulgu (bölge)" : "finding(s) (region)"} · ${sevLabel(region.severity)}`,
							onClick: () => jump(region.ids)
						}, q);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: 3,
						y: 86,
						className: "fill-muted-foreground",
						style: {
							fontSize: 8,
							fontWeight: 700
						},
						children: "R"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: 319.4,
						y: 86,
						className: "fill-muted-foreground",
						style: {
							fontSize: 8,
							fontWeight: 700
						},
						children: "L"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: PAD,
						x2: 316.4,
						y1: 79,
						y2: 79,
						stroke: "#e2e8f0",
						strokeWidth: .8,
						strokeDasharray: "3 3"
					}),
					row(UPPER, true),
					row(LOWER, false)
				]
			}),
			[...teeth.values()].some((m) => m.estimated) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[10px] leading-snug text-muted-foreground",
				children: tr ? "≈ Kesikli çizgili dişler: numara kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)." : "≈ Dashed teeth: numbers are estimated from arch geometry (not model output)."
			}) : null,
			quads.size > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[10px] leading-snug text-muted-foreground",
				children: tr ? "Renkli bölgeler, bulgunun görüntüdeki konumundan türetilir; model diş numarası üretmez." : "Tinted regions are derived from each finding's position in the image; the model does not number teeth."
			}) : null
		]
	});
}
var SEV = {
	high: {
		bg: "bg-high",
		text: {
			tr: "Yüksek",
			en: "High"
		}
	},
	medium: {
		bg: "bg-medium",
		text: {
			tr: "Orta",
			en: "Medium"
		}
	},
	low: {
		bg: "bg-low",
		text: {
			tr: "Düşük",
			en: "Low"
		}
	}
};
function Section({ icon, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
			className: "mb-2 flex items-center gap-1.5 text-xs font-semibold",
			children: [icon, title]
		}), children]
	});
}
function ReportTab({ modality, findings }) {
	const lang = useApp((s) => s.language);
	const mio = useApp((s) => s.mioClassification);
	const setSelected = useApp((s) => s.setSelectedFindingId);
	const tr = lang === "tr";
	const report = (0, import_react.useMemo)(() => buildReport({
		lang,
		modality,
		findings,
		mio: modality === "intraoral" ? mio : null
	}), [
		lang,
		modality,
		findings,
		mio
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-xl border border-border bg-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold leading-tight",
						children: report.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: report.reportId
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3" }), report.generatedAt.toLocaleDateString(tr ? "tr-TR" : "en-GB")]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "col-span-2 inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stethoscope, { className: "size-3" }), report.studyType]
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					{
						label: tr ? "Bulgu" : "Findings",
						value: String(report.total)
					},
					{
						label: tr ? "Yüksek öncelik" : "High priority",
						value: String(report.counts.high),
						accent: report.counts.high > 0
					},
					{
						label: tr ? "Ort. güven" : "Avg. conf.",
						value: `${Math.round(report.avgConfidence * 100)}%`
					}
				].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card px-2 py-2.5 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("text-xl font-bold leading-none tabular-nums", m.accent && "text-high"),
						children: m.value
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[10px] text-muted-foreground",
						children: m.label
					})]
				}, m.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-accent/70 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-1 text-xs font-semibold text-primary",
					children: tr ? "Klinik izlenim" : "Clinical impression"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs leading-relaxed text-foreground/85",
					children: report.impression
				})]
			}),
			report.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: tr ? "Öncelik dağılımı" : "Priority distribution",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-secondary",
					children: [
						"high",
						"medium",
						"low"
					].map((s) => report.counts[s] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: SEV[s].bg,
						style: { flexGrow: report.counts[s] }
					}, s) : null)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground",
					children: [
						"high",
						"medium",
						"low"
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", SEV[s].bg) }),
							SEV[s].text[lang],
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "tabular-nums text-foreground",
								children: report.counts[s]
							})
						]
					}, s))
				})]
			}) : null,
			report.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: tr ? "Öncelik sırasına göre bulgular" : "Findings by priority",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-border/60",
					children: report.priority.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setSelected(r.finding.id),
						className: "flex w-full items-center gap-2 py-2 text-left transition-colors hover:bg-muted/50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white",
								style: { background: `var(${r.finding.colorVar})` },
								children: r.n
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block truncate text-xs font-semibold",
									children: [r.tooth ? `${r.tooth} · ` : "", r.label]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-[10px] text-muted-foreground",
									children: r.region
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-semibold tabular-nums",
								children: [Math.round(r.confidence * 100), "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("size-2 shrink-0 rounded-full", SEV[r.severity].bg),
								title: r.severityText
							})
						]
					}) }, r.finding.id))
				}), report.hasEstimatedTeeth ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[10px] leading-snug text-muted-foreground",
					children: tr ? "≈ Diş numaraları kemer geometrisinden tahmin edilmiştir (model çıktısı değildir)." : "≈ Tooth numbers are estimated from arch geometry (not model output)."
				}) : null]
			}) : null,
			modality === "xray" && report.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: tr ? "Kadran dağılımı (FDI)" : "Quadrant distribution (FDI)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-1.5",
					children: [
						report.quadrants[0],
						report.quadrants[1],
						report.quadrants[3],
						report.quadrants[2]
					].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px]", q.count ? "border-border bg-card" : "border-dashed border-border/70 text-muted-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: q.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5 font-semibold tabular-nums",
							children: [q.severity ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", SEV[q.severity].bg) }) : null, q.count]
						})]
					}, q.q))
				})
			}) : null,
			report.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: tr ? "Bulgu türleri" : "Finding types",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: report.types.map((tp) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "size-2 rounded-full",
								style: { background: `var(${tp.colorVar})` }
							}),
							tp.label,
							tp.count > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
								className: "tabular-nums",
								children: ["×", tp.count]
							}) : null
						]
					}, tp.key))
				})
			}) : null,
			report.mio ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: tr ? "MIO — Diş eti / periodontal sınıflama" : "MIO — gingival / periodontal classification",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: report.mio.label }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: [
								"(",
								(report.mio.confidence * 100).toFixed(1),
								"%)"
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 space-y-1.5",
					children: report.mio.probabilities.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-[11px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-24 shrink-0 text-muted-foreground",
								children: p.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "h-1.5 flex-1 overflow-hidden rounded-full bg-secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block h-full rounded-full bg-primary",
									style: { width: `${p.value * 100}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "w-9 text-right tabular-nums",
								children: [Math.round(p.value * 100), "%"]
							})
						]
					}, p.label))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-3.5 text-primary" }),
				title: tr ? "Öneriler" : "Recommendations",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: report.recommendations.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-xs leading-relaxed",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-semibold",
							children: [r.title, ": "]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: r.text
						})]
					}, `${r.title}-${r.text}`))
				})
			})
		]
	});
}
function FindingsPanel({ modality, findings }) {
	const lang = useApp((s) => s.language);
	const selected = useApp((s) => s.selectedFindingId);
	const setSelected = useApp((s) => s.setSelectedFindingId);
	const hidden = useApp((s) => s.hiddenFindingIds);
	const toggleHidden = useApp((s) => s.toggleFindingHidden);
	const setHidden = useApp((s) => s.setHiddenFindingIds);
	const allShown = findings.every((f) => !hidden.includes(f.id));
	const [tab, setTab] = (0, import_react.useState)("ai");
	const itemRefs = (0, import_react.useRef)({});
	(0, import_react.useEffect)(() => {
		if (!selected) return;
		setTab("ai");
		const id = requestAnimationFrame(() => itemRefs.current[selected]?.scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		}));
		return () => cancelAnimationFrame(id);
	}, [selected]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "card-surface flex flex-col rounded-2xl p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex rounded-xl bg-secondary p-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setTab("ai"),
					className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold", tab === "ai" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-3.5" }), t(lang, "common.aiAnalysis")]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setTab("report"),
					className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold", tab === "report" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5" }), t(lang, "common.report")]
				})]
			}),
			tab === "ai" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				modality === "xray" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DentalChart, {
					findings,
					tr: lang === "tr"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: t(lang, "common.detected")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: t(lang, modality === "xray" ? "common.detectedHintXray" : "common.detectedHintIntra")
						})] })]
					}), findings.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setHidden(allShown ? findings.map((f) => f.id) : []),
						className: "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground",
						children: [allShown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" }), allShown ? lang === "tr" ? "Hepsini gizle" : "Hide all" : lang === "tr" ? "Hepsini göster" : "Show all"]
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [findings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-xl bg-muted px-3 py-4 text-xs leading-relaxed text-muted-foreground",
						children: t(lang, "common.noFindings")
					}) : null, findings.map((f, index) => {
						const isSelected = selected === f.id;
						const isHidden = hidden.includes(f.id);
						const pct = Math.round(f.confidence * 100);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							ref: (el) => {
								itemRefs.current[f.id] = el;
							},
							className: cn("overflow-hidden rounded-xl border border-border bg-card transition-colors", isSelected && "border-primary/40 bg-accent/50"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-stretch",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-expanded": isSelected,
									onClick: () => setSelected(isSelected ? null : f.id),
									className: cn("flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-1 text-left transition-opacity", isHidden && "opacity-50"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "relative flex size-10 shrink-0 items-center justify-center rounded-full",
										style: { background: `color-mix(in oklab, var(${f.colorVar}) 14%, white)` },
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToothMark, {
											className: "size-4",
											style: { color: `var(${f.colorVar})` }
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute -right-1 -top-1 grid size-4 place-items-center rounded-full text-[9px] font-bold leading-none text-white ring-1 ring-white",
											style: { background: `var(${f.colorVar})` },
											children: index + 1
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 text-sm font-semibold leading-tight",
													children: [toothDisplay(f) ? `${lang === "tr" ? "Diş" : "Tooth"} ${toothDisplay(f)} – ` : "", findingLabel(lang, f.key)]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex shrink-0 items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: f.severity,
														children: t(lang, `common.${f.severity}`)
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs font-semibold tabular-nums",
														children: [pct, "%"]
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-secondary",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block h-full rounded-full",
													style: {
														width: `${pct}%`,
														background: `var(${f.colorVar})`
													}
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1.5 block text-xs leading-snug text-muted-foreground",
												children: findingDesc(lang, f.descriptionKey)
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center justify-between border-l border-border/60 px-1.5 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": !isHidden,
										"aria-label": lang === "tr" ? "Görüntüde göster/gizle" : "Show/hide on image",
										title: lang === "tr" ? "Görüntüde göster/gizle" : "Show/hide on image",
										onClick: () => toggleHidden(f.id),
										className: cn("grid size-7 place-items-center rounded-full transition-colors hover:bg-muted", isHidden ? "text-muted-foreground" : "text-primary"),
										children: isHidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: cn("size-4 text-muted-foreground transition-transform", isSelected && "rotate-90") })]
								})]
							}), isSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingDetails, {
								finding: f,
								lang,
								modality
							}) : null]
						}, f.id);
					})]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTab, {
				modality,
				findings
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				className: "mt-3 w-full",
				onClick: () => void downloadReportPdf({
					lang,
					xray: modality === "xray" ? findings : [],
					intraoral: modality === "intraoral" ? findings : [],
					fusion: fuseFindings(modality === "xray" ? findings : [], modality === "intraoral" ? findings : []),
					reportType: modality
				}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), t(lang, "common.downloadPdf")]
			})
		]
	});
}
var XRAY_VIEWS = [
	{
		id: "overview",
		title: "views.overview",
		hint: "views.overviewHint"
	},
	{
		id: "health",
		title: "views.health",
		hint: "views.healthHint"
	},
	{
		id: "ai",
		title: "views.ai",
		hint: "views.aiHint"
	},
	{
		id: "bone",
		title: "views.bone",
		hint: "views.boneHint"
	}
];
var INTRA_VIEWS = [
	{
		id: "overview",
		title: "views.intraOverview",
		hint: "views.intraOverviewHint"
	},
	{
		id: "health",
		title: "views.surface",
		hint: "views.surfaceHint"
	},
	{
		id: "ai",
		title: "views.gums",
		hint: "views.gumsHint"
	},
	{
		id: "bone",
		title: "views.intraAi",
		hint: "views.intraAiHint"
	}
];
function filterCss(adjust, view) {
	return `brightness(${1 + adjust.brightness / 100}) contrast(${adjust.contrast}) invert(${adjust.invert || view === "bone" ? 1 : 0})${view === "health" ? " saturate(1.15)" : view === "ai" ? " contrast(1.12)" : ""}`;
}
function Heatmap({ findings }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0",
		children: findings.map((f) => {
			const [x1, y1, x2, y2] = f.bbox;
			const cx = (x1 + x2) / 2 * 100;
			const cy = (y1 + y2) / 2 * 100;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-2xl",
				style: {
					left: `${cx}%`,
					top: `${cy}%`,
					background: `radial-gradient(circle, var(${f.colorVar}) 0%, transparent 70%)`
				}
			}, `h-${f.id}`);
		})
	});
}
function ImageWorkspace({ modality, image, findings, adjust, onAdjust, onReset, onUpload, analyzing, dropLabel }) {
	const lang = useApp((s) => s.language);
	const selectedFindingId = useApp((s) => s.selectedFindingId);
	const setSelectedFindingId = useApp((s) => s.setSelectedFindingId);
	const hiddenFindingIds = useApp((s) => s.hiddenFindingIds);
	const inputRef = (0, import_react.useRef)(null);
	const stageRef = (0, import_react.useRef)(null);
	const [crop, setCrop] = (0, import_react.useState)(false);
	const [natural, setNatural] = (0, import_react.useState)({
		w: 16,
		h: 9
	});
	const views = modality === "xray" ? XRAY_VIEWS : INTRA_VIEWS;
	const onFile = async (file) => {
		if (!file) return;
		onUpload(await fileToDataUrl(file));
	};
	const cycleView = (dir) => {
		const i = views.findIndex((v) => v.id === adjust.view);
		const next = views[(i + dir + views.length) % views.length];
		onAdjust({ view: next.id });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface overflow-hidden rounded-2xl p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanSearch, {}),
						label: t(lang, "common.zoom"),
						active: adjust.zoom > 1,
						onClick: () => onAdjust({
							zoom: adjust.zoom > 1 ? 1 : 1.6,
							panX: 0,
							panY: 0
						})
					}),
					modality === "xray" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlipHorizontal, {}),
						label: t(lang, "common.invert"),
						active: adjust.invert,
						onClick: () => onAdjust({ invert: !adjust.invert })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SunMedium, {}),
						label: t(lang, "common.brightness"),
						active: adjust.brightness !== 0,
						onClick: () => onAdjust({ brightness: adjust.brightness === 0 ? 18 : 0 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Contrast, {}),
						label: t(lang, "common.contrast"),
						active: adjust.contrast !== 1,
						onClick: () => onAdjust({ contrast: adjust.contrast === 1 ? 1.35 : 1 })
					}),
					modality === "xray" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SunMedium, {}),
						label: t(lang, "common.brightness"),
						active: adjust.brightness !== 0,
						onClick: () => onAdjust({ brightness: adjust.brightness === 0 ? 16 : 0 })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crop, {}),
						label: t(lang, "common.crop"),
						active: crop,
						onClick: () => setCrop((v) => !v)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolChip, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}),
						label: t(lang, "common.reset"),
						onClick: onReset
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex rounded-xl bg-secondary p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: cn("rounded-lg px-3 py-1.5 text-xs font-semibold", adjust.showOverlay ? "bg-primary text-primary-foreground" : "text-muted-foreground"),
							onClick: () => onAdjust({ showOverlay: true }),
							children: t(lang, "common.2d")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: cn("rounded-lg px-3 py-1.5 text-xs font-semibold", !adjust.showOverlay ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"),
							onClick: () => onAdjust({ showOverlay: false }),
							children: t(lang, "common.original")
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: stageRef,
				className: "relative overflow-hidden rounded-xl bg-foreground",
				onWheel: (e) => {
					e.preventDefault();
					onAdjust({ zoom: Math.min(3, Math.max(1, adjust.zoom + (e.deltaY < 0 ? .15 : -.15))) });
				},
				children: [
					image ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mx-auto w-full max-h-[70vh]",
						style: {
							aspectRatio: `${Math.max(1, natural.w)} / ${Math.max(1, natural.h)}`,
							transform: `translate(${adjust.panX}px, ${adjust.panY}px) scale(${adjust.zoom})`,
							transformOrigin: "center center"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: image,
								alt: modality === "xray" ? "Panoramic radiograph" : "Intraoral photograph",
								className: "absolute inset-0 size-full object-contain",
								style: { filter: filterCss(adjust, adjust.view) },
								draggable: false,
								crossOrigin: "anonymous",
								onLoad: (e) => {
									const el = e.currentTarget;
									if (el.naturalWidth && el.naturalHeight) setNatural({
										w: el.naturalWidth,
										h: el.naturalHeight
									});
								}
							}),
							adjust.showOverlay ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [adjust.view === "ai" || adjust.view === "bone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heatmap, { findings: findings.filter((f) => !hiddenFindingIds.includes(f.id)) }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingOverlay, {
								findings,
								hiddenIds: hiddenFindingIds,
								lang,
								selectedId: selectedFindingId,
								onSelect: setSelectedFindingId
							})] }) : null,
							crop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-8 rounded-lg border-2 border-dashed border-primary-foreground/80" }) : null
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex aspect-16/9 w-full flex-col items-center justify-center gap-3 bg-secondary text-muted-foreground",
						onClick: () => inputRef.current?.click(),
						onDragOver: (e) => e.preventDefault(),
						onDrop: (e) => {
							e.preventDefault();
							onFile(e.dataTransfer.files[0]);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-8" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: dropLabel
						})]
					}),
					analyzing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/55 text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-8 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: t(lang, "common.analyzing")
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground",
						onClick: () => cycleView(-1),
						children: "‹"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground",
						onClick: () => cycleView(1),
						children: "›"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-3 left-3 rounded-lg bg-foreground/70 px-2 py-1 text-xs text-primary-foreground",
						children: [
							views.findIndex((v) => v.id === adjust.view) + 1,
							"/",
							views.length
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute right-3 bottom-3 flex gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								onClick: () => onAdjust({ zoom: Math.min(3, adjust.zoom + .25) }),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								onClick: () => onAdjust({ zoom: Math.max(1, adjust.zoom - .25) }),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								onClick: () => {
									const el = stageRef.current;
									if (!el) return;
									if (document.fullscreenElement) document.exitFullscreen();
									else el.requestFullscreen();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								onClick: () => {
									if (!image) return;
									const a = document.createElement("a");
									a.href = image;
									a.download = `${modality}.jpg`;
									a.click();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid grid-cols-2 gap-2 md:grid-cols-4",
				children: views.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onAdjust({
						view: v.id,
						showOverlay: true
					}),
					className: cn("overflow-hidden rounded-xl border text-left transition-colors", adjust.view === v.id ? "border-primary" : "border-border"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative aspect-16/7 bg-foreground",
						children: image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: image,
							alt: "",
							className: "size-full object-cover",
							style: { filter: filterCss(adjust, v.id) }
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-full items-center justify-center text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "size-5" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 px-2.5 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Expand, { className: "size-3.5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold",
							children: t(lang, v.title)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: t(lang, v.hint)
						})] })]
					})]
				}, v.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "file",
					accept: "image/*",
					className: "hidden",
					onChange: (e) => {
						const file = e.target.files?.[0];
						e.target.value = "";
						onFile(file);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => inputRef.current?.click(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {}), image ? t(lang, "common.replace") : t(lang, "common.upload")]
				})]
			})
		]
	});
}
function ToolChip({ icon, label, onClick, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("toolbar-chip inline-flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-xs font-medium text-foreground", active && "ring-2 ring-primary/25"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground [&_svg]:size-3.5",
			children: icon
		}), label]
	});
}
function IconBtn({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "flex size-8 items-center justify-center rounded-lg bg-foreground/70 text-primary-foreground [&_svg]:size-3.5",
		children
	});
}
//#endregion
export { FindingsSummary as n, ImageWorkspace as r, FindingsPanel as t };
