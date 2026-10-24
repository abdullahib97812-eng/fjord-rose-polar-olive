import { o as __toESM } from "../_runtime.mjs";
import { K as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import "./router-DbGY460Q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BH18C1WT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const [App, setApp] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			const [{ default: ChatApp }, lock, orient] = await Promise.all([
				import("./App-CKxV5qBt.mjs").then((n) => n.t),
				import("./interaction-lock-RJP5G1zJ.mjs"),
				import("./orientation-lock-CGzZ5Q_Q.mjs")
			]);
			lock.installInteractionLock();
			orient.installOrientationLock();
			if (!cancelled) setApp(() => ChatApp);
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	if (!App) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		style: {
			minHeight: "100dvh",
			background: "#ffb3cc",
			display: "grid",
			placeItems: "center",
			color: "#7a2040",
			fontFamily: "\"Cormorant Garamond\", Georgia, serif"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			style: {
				fontSize: 28,
				margin: 0
			},
			children: "Our Chat"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		id: "root",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {})
	});
}
//#endregion
export { Home as component };
