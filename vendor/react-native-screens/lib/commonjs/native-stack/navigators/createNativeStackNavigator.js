"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _native = require("@react-navigation/native");
var React = _interopRequireWildcard(require("react"));
var _NativeStackView = _interopRequireDefault(require("../views/NativeStackView"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function NativeStackNavigator({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}) {
  const {
    state,
    descriptors,
    navigation
  } = (0, _native.useNavigationBuilder)(_native.StackRouter, {
    initialRouteName,
    children,
    screenOptions
  });

  // Starting from React Navigation v6, `native-stack` should be imported from
  // `@react-navigation/native-stack` rather than `react-native-screens/native-stack`
  React.useEffect(() => {
    // @ts-ignore navigation.dangerouslyGetParent was removed in v6
    if (navigation?.dangerouslyGetParent === undefined) {
      console.warn('Looks like you are importing `native-stack` from `react-native-screens/native-stack`. Since version 6 of `react-navigation`, it should be imported from `@react-navigation/native-stack`.');
    }
  }, [navigation]);
  React.useEffect(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation?.addListener?.('tabPress', e => {
    const isFocused = navigation.isFocused();

    // Run the operation in the next frame so we're sure all listeners have been run
    // This is necessary to know if preventDefault() has been called
    requestAnimationFrame(() => {
      if (state.index > 0 && isFocused && !e.defaultPrevented) {
        // When user taps on already focused tab and we're inside the tab,
        // reset the stack to replicate native behaviour
        navigation.dispatch({
          ..._native.StackActions.popToTop(),
          target: state.key
        });
      }
    });
  }), [navigation, state.index, state.key]);
  return /*#__PURE__*/React.createElement(_NativeStackView.default, _extends({}, rest, {
    state: state,
    navigation: navigation,
    descriptors: descriptors
  }));
}
var _default = exports.default = (0, _native.createNavigatorFactory)(NativeStackNavigator);
//# sourceMappingURL=createNativeStackNavigator.js.map