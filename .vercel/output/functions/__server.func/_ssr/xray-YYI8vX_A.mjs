import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { d as useApp, l as t } from "./store-98_nkWXH.mjs";
import { n as filterByQuery } from "./router-yyNiYiFe.mjs";
import { n as FindingsSummary, r as ImageWorkspace, t as FindingsPanel } from "./image-workspace-C-mgb5on.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/xray-YYI8vX_A.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function XrayPage() {
	const lang = useApp((s) => s.language);
	const query = useApp((s) => s.query);
	const image = useApp((s) => s.xrayImage);
	const findings = useApp((s) => s.xrayFindings);
	const adjust = useApp((s) => s.xrayAdjust);
	const analyzing = useApp((s) => s.analyzing) === "xray";
	const setXrayAdjust = useApp((s) => s.setXrayAdjust);
	const resetXrayAdjust = useApp((s) => s.resetXrayAdjust);
	const runXray = useApp((s) => s.runXray);
	const threshold = useApp((s) => s.threshold);
	const visible = filterByQuery(findings, query, lang).filter((f) => f.confidence >= threshold);
	const analyzedImageRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (image && image !== analyzedImageRef.current && !analyzing && findings.length === 0) {
			analyzedImageRef.current = image;
			runXray(image);
		}
	}, [image]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingsSummary, { findings: visible }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageWorkspace, {
				modality: "xray",
				image,
				findings: visible,
				adjust,
				onAdjust: setXrayAdjust,
				onReset: resetXrayAdjust,
				onUpload: (url) => void runXray(url),
				analyzing,
				dropLabel: t(lang, "common.drop")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingsPanel, {
				modality: "xray",
				findings: visible
			})]
		})]
	});
}
//#endregion
export { XrayPage as component };
