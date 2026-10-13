"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SafeAreaProviderCompat;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// code taken from
// https://github.com/react-navigation/react-navigation/blob/ec0d113eb25c39ef9defb6c7215640f44e3569ae/packages/elements/src/SafeAreaProviderCompat.tsx

const {
  width = 0,
  height = 0
} = _reactNative.Dimensions.get('window');

// To support SSR on web, we need to have empty insets for initial values
// Otherwise there can be mismatch between SSR and client output
// We also need to specify empty values to support tests environments
const initialMetrics = _reactNative.Platform.OS === 'web' || _reactNativeSafeAreaContext.initialWindowMetrics == null ? {
  frame: {
    x: 0,
    y: 0,
    width,
    height
  },
  insets: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
} : _reactNativeSafeAreaContext.initialWindowMetrics;
function SafeAreaProviderCompat({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement(_reactNativeSafeAreaContext.SafeAreaInsetsContext.Consumer, null, insets => {
    if (insets) {
      // If we already have insets, don't wrap the stack in another safe area provider
      // This avoids an issue with updates at the cost of potentially incorrect values
      // https://github.com/react-navigation/react-navigation/issues/174
      return /*#__PURE__*/React.createElement(_reactNative.View, {
        style: [styles.container, style]
      }, children);
    }
    return /*#__PURE__*/React.createElement(_reactNativeSafeAreaContext.SafeAreaProvider, {
      initialMetrics: initialMetrics,
      style: style
    }, children);
  });
}
SafeAreaProviderCompat.initialMetrics = initialMetrics;
const styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});
//# sourceMappingURL=SafeAreaProviderCompat.js.map