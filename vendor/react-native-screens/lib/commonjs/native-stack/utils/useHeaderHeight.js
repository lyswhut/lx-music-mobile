"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useHeaderHeight;
var React = _interopRequireWildcard(require("react"));
var _HeaderHeightContext = _interopRequireDefault(require("./HeaderHeightContext"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function useHeaderHeight() {
  const height = React.useContext(_HeaderHeightContext.default);
  if (height === undefined) {
    throw new Error("Couldn't find the header height. Are you inside a screen in a navigator with a header?");
  }
  return height;
}
//# sourceMappingURL=useHeaderHeight.js.map