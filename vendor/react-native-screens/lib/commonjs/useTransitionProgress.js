"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useTransitionProgress;
var React = _interopRequireWildcard(require("react"));
var _TransitionProgressContext = _interopRequireDefault(require("./TransitionProgressContext"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function useTransitionProgress() {
  const progress = React.useContext(_TransitionProgressContext.default);
  if (progress === undefined) {
    throw new Error("Couldn't find values for transition progress. Are you inside a screen in Native Stack?");
  }
  return progress;
}
//# sourceMappingURL=useTransitionProgress.js.map