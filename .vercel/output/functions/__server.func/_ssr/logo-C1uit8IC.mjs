import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as cn } from "./store-98_nkWXH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/logo-C1uit8IC.js
var import_jsx_runtime = require_jsx_runtime();
function ToothMark({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 32 32",
		className: cn("size-5", className),
		"aria-hidden": "true",
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M16 4.2c3.2 0 5.6 1.7 7.2 3.6 1.5 1.8 2.4 4 2.6 6.2.2 2.4-.4 4.5-1.6 6.6-1.1 1.9-2.2 3.6-2.6 5.8-.3 1.6-1.6 2.8-3.2 2.8-1.2 0-2-.7-2.4-1.8L16 25l-.1 2.4c-.4 1.1-1.2 1.8-2.4 1.8-1.6 0-2.9-1.2-3.2-2.8-.4-2.2-1.5-3.9-2.6-5.8-1.2-2.1-1.8-4.2-1.6-6.6.2-2.2 1.1-4.4 2.6-6.2C10.4 5.9 12.8 4.2 16 4.2Z"
		})
	});
}
function BrandLockup({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToothMark, { className: "size-5" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-base font-semibold tracking-tight text-foreground",
				children: "DentaAI"
			}), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-xs text-muted-foreground",
				children: "AI-Powered Dental Analysis"
			}) : null]
		})]
	});
}
//#endregion
export { ToothMark as n, BrandLockup as t };
