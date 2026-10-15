import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { d as useApp, l as t } from "./store-98_nkWXH.mjs";
import { H as Aperture, T as Heart, m as Move, r as TriangleAlert, s as Sparkles, x as Lamp } from "../_libs/lucide-react.mjs";
import { n as filterByQuery } from "./router-yyNiYiFe.mjs";
import { t as Badge } from "./fusion-BQBcjWco.mjs";
import { n as FindingsSummary, r as ImageWorkspace, t as FindingsPanel } from "./image-workspace-C-mgb5on.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/intraoral-BrMuf9kb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function IntraoralPage() {
	const lang = useApp((s) => s.language);
	const query = useApp((s) => s.query);
	const image = useApp((s) => s.intraoralImage);
	const stateFindings = useApp((s) => s.intraoralFindings);
	const findings = filterByQuery(stateFindings, query, lang);
	const mioClassification = useApp((s) => s.mioClassification);
	const adjust = useApp((s) => s.intraoralAdjust);
	const analyzing = useApp((s) => s.analyzing) === "intraoral";
	const setIntraoralAdjust = useApp((s) => s.setIntraoralAdjust);
	const resetIntraoralAdjust = useApp((s) => s.resetIntraoralAdjust);
	const runIntraoral = useApp((s) => s.runIntraoral);
	const threshold = useApp((s) => s.threshold);
	const analyzedImageRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (image && image !== analyzedImageRef.current && !analyzing && stateFindings.length === 0) {
			analyzedImageRef.current = image;
			runIntraoral(image);
		}
	}, [image]);
	console.log(`[INTRAORAL] State findings: ${stateFindings.length}, After filter: ${findings.length}`);
	console.log(`[INTRAORAL] Threshold: ${threshold}`);
	console.log(`[INTRAORAL] State findings list:`);
	stateFindings.forEach((f, i) => {
		console.log(`  ${i + 1}. ${f.id} | ${f.key} | ${f.confidence.toFixed(4)} | bbox: [${f.bbox.map((b) => b.toFixed(4)).join(", ")}]`);
	});
	const visible = findings.filter((f) => f.confidence >= threshold);
	const overlayFindings = findings.filter((f) => f.confidence >= threshold);
	console.log(`[INTRAORAL] Visible cards: ${visible.length}, Overlay findings: ${overlayFindings.length}`);
	console.log(`[INTRAORAL] Filtered out by threshold: ${findings.length - visible.length}`);
	findings.filter((f) => f.confidence < threshold).forEach((f, i) => {
		console.log(`  Filtered: ${f.id} | ${f.key} | conf: ${f.confidence.toFixed(4)} < threshold: ${threshold}`);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingsSummary, { findings: visible }),
			mioClassification && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface rounded-2xl p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 text-sm font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-4 text-primary" }), "MIO — Diş Eti / Periodontal Analiz"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: mioClassification.class_name === "healthy" ? "muted" : mioClassification.class_name === "gingivitis" ? "primary" : "high",
						children: mioClassification.class_name.charAt(0).toUpperCase() + mioClassification.class_name.slice(1)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm text-muted-foreground",
						children: [(mioClassification.confidence * 100).toFixed(1), "% confidence"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageWorkspace, {
						modality: "intraoral",
						image,
						findings: overlayFindings,
						adjust,
						onAdjust: setIntraoralAdjust,
						onReset: resetIntraoralAdjust,
						onUpload: (url) => void runIntraoral(url),
						analyzing,
						dropLabel: t(lang, "common.dropIntra")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-surface rounded-2xl p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 text-sm font-semibold",
								children: t(lang, "intra.tips")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lamp, { className: "size-4" }),
										text: t(lang, "intra.tip1")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }),
										text: t(lang, "intra.tip2")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Move, { className: "size-4" }),
										text: t(lang, "intra.tip3")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, { className: "size-4" }),
										text: t(lang, "intra.tip4")
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-medium/20 bg-medium-soft p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-2 text-sm font-semibold text-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4" }), t(lang, "intra.quality")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted-foreground",
								children: t(lang, "intra.qualityBody")
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingsPanel, {
					modality: "intraoral",
					findings: visible
				})]
			})
		]
	});
}
function Tip({ icon, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-2 text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 text-primary",
			children: icon
		}), text]
	});
}
//#endregion
export { IntraoralPage as component };
