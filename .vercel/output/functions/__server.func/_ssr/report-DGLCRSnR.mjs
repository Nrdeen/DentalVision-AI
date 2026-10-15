import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as findingLabel, d as useApp, l as t, n as cn, t as Button } from "./store-98_nkWXH.mjs";
import { C as Images, D as FileText, F as CircleCheck, S as Info, b as Lightbulb, j as Download, r as TriangleAlert, y as Link2, z as Brain } from "../_libs/lucide-react.mjs";
import { i as getRecommendationKeys, r as fuseFindings, t as Badge } from "./fusion-BQBcjWco.mjs";
import { r as downloadReportPdf, t as FindingOverlay } from "./finding-overlay-BkfSyVFw.mjs";
import { n as MiniFinding } from "./finding-cards-6tD_Svwr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/report-DGLCRSnR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReportPage() {
	const lang = useApp((s) => s.language);
	const xrayImage = useApp((s) => s.xrayImage);
	const intraoralImage = useApp((s) => s.intraoralImage);
	const xrayFindings = useApp((s) => s.xrayFindings);
	const intraoralFindings = useApp((s) => s.intraoralFindings);
	const fusion = (0, import_react.useMemo)(() => {
		if (xrayImage && intraoralImage) return fuseFindings(xrayFindings, intraoralFindings);
		else if (xrayImage && !intraoralImage) return fuseFindings(xrayFindings, []);
		else if (!xrayImage && intraoralImage) return fuseFindings([], intraoralFindings);
		else return fuseFindings([], []);
	}, [
		xrayFindings,
		intraoralFindings,
		xrayImage,
		intraoralImage
	]);
	const [tab, setTab] = (0, import_react.useState)("fusion");
	const [mode, setMode] = (0, import_react.useState)("compare");
	const overall = fusion.overallKey === "moderate" ? t(lang, "report.moderate") : fusion.overallKey === "mild" ? t(lang, "report.mild") : t(lang, "report.lowRisk");
	const note = fusion.noteKey === "review" ? t(lang, "report.review") : fusion.noteKey === "follow" ? t(lang, "report.follow") : t(lang, "report.routine");
	const xList = mode === "matched" ? xrayFindings.filter((f) => ["caries", "deepCaries"].includes(f.key)) : xrayFindings;
	const iList = mode === "matched" ? intraoralFindings.filter((f) => ["earlyCaries", "caries"].includes(f.key)) : intraoralFindings;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-12 items-center justify-center rounded-2xl bg-accent text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-6" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-semibold tracking-tight",
					children: t(lang, "report.title")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: t(lang, "report.subtitle")
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "size-5" }),
						label: t(lang, "report.xrayCard"),
						value: fusion.xrayCount,
						hint: t(lang, "report.issues"),
						tone: "primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-5" }),
						label: t(lang, "report.intraCard"),
						value: fusion.intraCount,
						hint: t(lang, "report.issues"),
						tone: "low"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryStat, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-5" }),
						label: t(lang, "report.sharedCard"),
						value: fusion.sharedCount,
						hint: t(lang, "report.sharedHint"),
						tone: "finding-gingivitis"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface rounded-2xl p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: t(lang, "report.overallCard")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xl font-semibold text-medium",
								children: overall
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "medium",
								className: "mt-2",
								children: note
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalityPane, {
								title: t(lang, "report.xrayTitle"),
								count: fusion.xrayCount,
								image: xrayImage,
								findings: xList
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalityPane, {
								title: t(lang, "report.intraTitle"),
								count: fusion.intraCount,
								image: intraoralImage,
								findings: iList
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1 rounded-2xl bg-secondary p-1",
							children: [
								["compare", "report.compare"],
								["matched", "report.matched"],
								["all", "report.all"]
							].map(([id, key]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMode(id),
								className: cn("flex-1 rounded-xl px-3 py-2 text-sm font-medium", mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"),
								children: t(lang, key)
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-surface overflow-hidden rounded-2xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-b border-border px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: t(lang, "report.table")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: t(lang, "report.tableHint")
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[640px] text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
										className: "bg-muted text-left text-xs text-muted-foreground",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-2 font-medium",
												children: t(lang, "report.colProblem")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-2 font-medium",
												children: t(lang, "report.colXray")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-2 font-medium",
												children: t(lang, "report.colIntra")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-2 font-medium",
												children: t(lang, "report.colResult")
											})
										] })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: fusion.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-t border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3 font-medium",
												children: findingLabel(lang, row.problemKey)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Presence, {
													on: row.xray,
													lang
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Presence, {
													on: row.intraoral,
													lang
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", row.level === "shared" && "bg-high-soft text-high", row.level === "xray_only" && "bg-medium-soft text-medium", row.level === "intra_only" && "bg-low-soft text-low"),
													children: [row.level === "shared" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3" }) : row.level === "xray_only" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3" }), t(lang, `report.${row.resultKey}`)]
												})
											})
										]
									}, row.problem)) })]
								})
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "card-surface rounded-2xl p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex rounded-xl bg-secondary p-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setTab("fusion"),
								className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold", tab === "fusion" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-3.5" }), t(lang, "report.fusion")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setTab("report"),
								className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold", tab === "report" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5" }), t(lang, "common.report")]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "flex items-center gap-2 text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4 text-primary" }), t(lang, "report.fusionLogic")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: t(lang, "report.fusionLead")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogicCard, {
							tone: "low-soft",
							title: t(lang, "report.logicShared"),
							hint: t(lang, "report.logicSharedHint"),
							ok: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogicCard, {
							tone: "accent",
							title: t(lang, "report.logicDeep"),
							hint: t(lang, "report.logicDeepHint")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogicCard, {
							tone: "secondary",
							title: t(lang, "report.logicSurface"),
							hint: t(lang, "report.logicSurfaceHint"),
							purple: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 rounded-xl bg-muted p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-1.5 text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4 text-primary" }), t(lang, "report.summaryTitle")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted-foreground",
								children: t(lang, "report.summaryBody").replace("{n}", String(fusion.rows.length))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-xl bg-accent p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center gap-1.5 text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-4 text-primary" }), t(lang, "common.recommendations")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-1 text-xs text-muted-foreground",
								children: getRecommendationKeys(fusion).map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["• ", t(lang, key)] }, key))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "mt-3 w-full",
							onClick: () => void downloadReportPdf({
								lang,
								xray: xrayFindings,
								intraoral: intraoralFindings,
								fusion,
								reportType: xrayImage && intraoralImage ? "combined" : xrayImage ? "xray" : "intraoral"
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), t(lang, "common.downloadPdf")]
						})
					]
				})]
			})
		]
	});
}
function SummaryStat({ icon, label, value, hint, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "card-surface rounded-2xl p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-10 items-center justify-center rounded-xl",
				style: {
					background: `color-mix(in oklab, var(--color-${tone}) 14%, white)`,
					color: `var(--color-${tone})`
				},
				children: icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-2xl font-semibold tabular-nums",
					children: value
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: hint
				})
			] })]
		})
	});
}
function ModalityPane({ title, count, image, findings }) {
	const lang = useApp((s) => s.language);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface overflow-hidden rounded-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "primary",
					children: [
						count,
						" ",
						t(lang, "report.issues")
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-16/10 bg-foreground",
				children: [image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: image,
					alt: "",
					className: "size-full object-cover"
				}) : null, image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingOverlay, {
					findings,
					lang,
					compact: true
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2 p-3",
				children: findings.slice(0, 4).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniFinding, {
					finding: f,
					lang
				}, f.id))
			})
		]
	});
}
function Presence({ on, lang }) {
	return on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "low",
		children: t(lang, "report.present")
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "muted",
		children: t(lang, "report.absent")
	});
}
function LogicCard({ title, hint, ok, purple, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("mb-2 rounded-xl p-3", tone === "low-soft" && "bg-low-soft", tone === "accent" && "bg-accent", tone === "secondary" && "bg-secondary"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-start gap-2 text-xs font-semibold",
			children: [ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-4 text-low" }) : purple ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-4 text-finding-gingivitis" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-4 text-primary" }), title]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 pl-6 text-xs text-muted-foreground",
			children: ["→ ", hint]
		})]
	});
}
//#endregion
export { ReportPage as component };
