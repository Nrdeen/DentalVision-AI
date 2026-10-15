import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn } from "./store-98_nkWXH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fusion-BQBcjWco.js
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
	variants: { variant: {
		high: "bg-high-soft text-high",
		medium: "bg-medium-soft text-medium",
		low: "bg-low-soft text-low",
		muted: "bg-secondary text-muted-foreground",
		primary: "bg-accent text-accent-foreground"
	} },
	defaultVariants: { variant: "muted" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
function ConfidenceRing({ value, colorVar, size = 52 }) {
	const r = 18;
	const c = 2 * Math.PI * r;
	const offset = c * (1 - value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: size,
		height: size,
		viewBox: "0 0 48 48",
		className: "shrink-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "24",
				r,
				fill: "none",
				stroke: "var(--color-secondary)",
				strokeWidth: "4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "24",
				r,
				fill: "none",
				stroke: `var(${colorVar})`,
				strokeWidth: "4",
				strokeLinecap: "round",
				strokeDasharray: c,
				strokeDashoffset: offset,
				transform: "rotate(-90 24 24)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
				x: "24",
				y: "26",
				textAnchor: "middle",
				className: "fill-foreground",
				style: {
					fontSize: "10px",
					fontWeight: 700
				},
				children: [Math.round(value * 100), "%"]
			})
		]
	});
}
function normalizeLabel(key, labelFallback = "") {
	const raw = `${key} ${labelFallback}`.toLowerCase();
	if (raw.includes("caries") || raw.includes("çürük") || raw.includes("curuk")) return "caries";
	if (raw.includes("gingivitis") || raw.includes("diş eti") || raw.includes("dis eti")) return "gingivitis";
	if (raw.includes("impacted") || raw.includes("gömülü") || raw.includes("gomulu")) return "impacted";
	if (raw.includes("periapical") || raw.includes("periapikal")) return "periapical";
	if (raw.includes("plaque") || raw.includes("plak")) return "plaque";
	if (raw.includes("ulcer") || raw.includes("ülser") || raw.includes("ulser")) return "ulcer";
	if (raw.includes("fracture") || raw.includes("kırık") || raw.includes("kirik")) return "fracture";
	if (raw.includes("kanal") || raw.includes("rootcanal") || raw.includes("root canal")) return "rootCanal";
	return key.toLowerCase();
}
var PROBLEM_KEYS = {
	caries: "cariesFamily",
	gingivitis: "gingivitis",
	impacted: "impacted",
	periapical: "periapical",
	plaque: "plaque",
	ulcer: "ulcer",
	fracture: "fracture",
	rootCanal: "rootCanal"
};
var NON_PROBLEM_KEYS = /* @__PURE__ */ new Set(["healthy"]);
function isProblemFinding(f) {
	return !NON_PROBLEM_KEYS.has(f.key);
}
function fuseFindings(xray, intraoral) {
	const xLabels = new Set(xray.filter(isProblemFinding).map((f) => normalizeLabel(f.key)));
	const iLabels = new Set(intraoral.filter(isProblemFinding).map((f) => normalizeLabel(f.key)));
	const shared = [...xLabels].filter((l) => iLabels.has(l));
	const onlyX = [...xLabels].filter((l) => !iLabels.has(l));
	const onlyI = [...iLabels].filter((l) => !xLabels.has(l));
	const rows = [.../* @__PURE__ */ new Set([...xLabels, ...iLabels])].sort().map((lab) => {
		const inX = xLabels.has(lab);
		const inI = iLabels.has(lab);
		const level = inX && inI ? "shared" : inX ? "xray_only" : "intra_only";
		const resultKey = level === "shared" ? "strong" : level === "xray_only" ? "deep" : "surface";
		return {
			problem: lab,
			problemKey: PROBLEM_KEYS[lab] ?? lab,
			xray: inX,
			intraoral: inI,
			resultKey,
			level
		};
	});
	let overallKey = "low";
	let noteKey = "routine";
	if (shared.length >= 1 || onlyX.length >= 2) {
		overallKey = "moderate";
		noteKey = "review";
	} else if (onlyX.length + onlyI.length >= 1) {
		overallKey = "mild";
		noteKey = "follow";
	}
	return {
		xrayCount: xray.length,
		intraCount: intraoral.length,
		sharedCount: shared.length,
		rows,
		overallKey,
		noteKey,
		shared,
		onlyX,
		onlyI
	};
}
/**
* Pick recommendation keys based on which problem families are actually present
* in the fused findings (excludes "healthy" and never names a condition that
* wasn't detected). "report.rec4" (general hygiene) is always included since it
* is generic advice, not a specific diagnosis claim.
*/
function getRecommendationKeys(fusion) {
	const present = /* @__PURE__ */ new Set([
		...fusion.shared,
		...fusion.onlyX,
		...fusion.onlyI
	]);
	const recs = [];
	if (present.has("caries")) recs.push("report.rec1");
	if (present.has("gingivitis") || present.has("periodontitis")) recs.push("report.rec2");
	if (present.has("impacted")) recs.push("report.rec3");
	recs.push("report.rec4");
	return recs;
}
//#endregion
export { getRecommendationKeys as i, ConfidenceRing as n, fuseFindings as r, Badge as t };
