import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as findingLabel, c as severityLabel, d as useApp, l as t, n as cn, s as positionLabel } from "./store-98_nkWXH.mjs";
import { n as ToothMark } from "./logo-C1uit8IC.mjs";
import { n as ConfidenceRing, t as Badge } from "./fusion-BQBcjWco.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/finding-cards-6tD_Svwr.js
var import_jsx_runtime = require_jsx_runtime();
function FindingCards({ findings, showTooth = true }) {
	const lang = useApp((s) => s.language);
	const selected = useApp((s) => s.selectedFindingId);
	const setSelected = useApp((s) => s.setSelectedFindingId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5",
		children: findings.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setSelected(selected === f.id ? null : f.id),
			className: cn("card-surface rounded-2xl p-4 text-left transition-shadow", selected === f.id && "ring-2 ring-primary/30"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-11 items-center justify-center rounded-full",
							style: { background: `color-mix(in oklab, var(${f.colorVar}) 14%, white)` },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToothMark, {
								className: "size-5",
								style: { color: `var(${f.colorVar})` }
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: showTooth && f.tooth !== "-" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: t(lang, "common.toothNo")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-semibold leading-tight",
								children: f.tooth
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: positionLabel(lang, f.positionKey)
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold leading-tight",
							children: findingLabel(lang, f.key)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: positionLabel(lang, f.positionKey)
						})] }) })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfidenceRing, {
						value: f.confidence,
						colorVar: f.colorVar
					})]
				}),
				showTooth && f.tooth !== "-" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm font-semibold",
					style: { color: `var(${f.colorVar})` },
					children: findingLabel(lang, f.key)
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						t(lang, "common.confidence"),
						": ",
						Math.round(f.confidence * 100),
						"%"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: f.severity,
						children: severityLabel(lang, f.severity)
					})
				})
			]
		}, f.id))
	});
}
function MiniFinding({ finding, lang }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3 rounded-xl bg-muted/80 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-8 items-center justify-center rounded-full",
				style: { background: `color-mix(in oklab, var(${finding.colorVar}) 14%, white)` },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToothMark, {
					className: "size-3.5",
					style: { color: `var(${finding.colorVar})` }
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm font-medium",
				children: [
					findingLabel(lang, finding.key),
					" ",
					finding.tooth !== "-" ? `(${finding.tooth})` : ""
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: positionLabel(lang, finding.positionKey)
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: finding.severity,
			children: lang === "tr" ? "Var" : "Yes"
		})]
	});
}
//#endregion
export { MiniFinding as n, FindingCards as t };
