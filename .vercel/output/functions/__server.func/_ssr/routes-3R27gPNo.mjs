import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { d as useApp, l as t, t as Button } from "./store-98_nkWXH.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Images, D as FileText, L as Camera, V as ArrowRight, s as Sparkles, z as Brain } from "../_libs/lucide-react.mjs";
import { n as filterByQuery } from "./router-yyNiYiFe.mjs";
import { r as fuseFindings } from "./fusion-BQBcjWco.mjs";
import { t as FindingCards } from "./finding-cards-6tD_Svwr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-3R27gPNo.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const lang = useApp((s) => s.language);
	const query = useApp((s) => s.query);
	const xrayImage = useApp((s) => s.xrayImage);
	const intraoralImage = useApp((s) => s.intraoralImage);
	const xrayFindings = filterByQuery(useApp((s) => s.xrayFindings), query, lang);
	const intraoralFindings = filterByQuery(useApp((s) => s.intraoralFindings), query, lang);
	const fusion = fuseFindings(xrayFindings, intraoralFindings);
	const loadDemo = useApp((s) => s.loadDemo);
	const overall = fusion.overallKey === "moderate" ? t(lang, "report.moderate") : fusion.overallKey === "mild" ? t(lang, "report.mild") : t(lang, "report.lowRisk");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card-surface overflow-hidden rounded-2xl p-5 md:p-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wide text-primary uppercase",
						children: t(lang, "home.kicker")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-foreground md:text-3xl",
						children: t(lang, "home.title")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground",
						children: t(lang, "home.lead")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/xray",
									children: [t(lang, "home.openXray"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/intraoral",
									children: t(lang, "home.openIntra")
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								onClick: loadDemo,
								children: t(lang, "common.loadDemo")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: t(lang, "home.statsX"),
						value: fusion.xrayCount,
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: t(lang, "home.statsI"),
						value: fusion.intraCount,
						tone: "low"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: t(lang, "home.statsS"),
						value: fusion.sharedCount,
						tone: "finding-gingivitis"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: t(lang, "home.statsO"),
						value: overall,
						tone: "medium"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewCard, {
					title: t(lang, "report.xrayTitle"),
					image: xrayImage,
					to: "/xray",
					cta: t(lang, "home.openXray"),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewCard, {
					title: t(lang, "report.intraTitle"),
					image: intraoralImage,
					to: "/intraoral",
					cta: t(lang, "home.openIntra"),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" })
				})]
			}),
			xrayFindings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 text-sm font-semibold",
				children: t(lang, "report.xrayTitle")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingCards, { findings: xrayFindings.slice(0, 4) })] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "card-surface rounded-2xl p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-4 text-sm font-semibold",
						children: t(lang, "home.pipeline")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 md:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "size-4" }),
								title: t(lang, "home.s1"),
								body: t(lang, "home.s1d")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" }),
								title: t(lang, "home.s2"),
								body: t(lang, "home.s2d")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4" }),
								title: t(lang, "home.s3"),
								body: t(lang, "home.s3d")
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/report",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {}), t(lang, "home.openReport")]
							})
						})
					})
				]
			})
		]
	});
}
function Stat({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface rounded-2xl p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-2xl font-semibold tabular-nums",
			style: { color: `var(--color-${tone})` },
			children: value
		})]
	});
}
function PreviewCard({ title, image, to, cta, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "card-surface group overflow-hidden rounded-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-16/8 bg-foreground",
			children: image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: image,
				alt: "",
				className: "size-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-full items-center justify-center text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-6" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-primary",
					children: icon
				}), title]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium text-primary group-hover:underline",
				children: cta
			})]
		})]
	});
}
function Step({ icon, title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-muted p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 flex size-9 items-center justify-center rounded-lg bg-accent text-primary",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs leading-relaxed text-muted-foreground",
				children: body
			})
		]
	});
}
//#endregion
export { Home as component };
