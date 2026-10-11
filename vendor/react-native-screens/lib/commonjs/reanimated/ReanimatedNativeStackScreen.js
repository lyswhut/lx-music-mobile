"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeScreens = require("react-native-screens");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _ReanimatedTransitionProgressContext = _interopRequireDefault(require("./ReanimatedTransitionProgressContext"));
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _getDefaultHeaderHeight = _interopRequireDefault(require("../native-stack/utils/getDefaultHeaderHeight"));
var _getStatusBarHeight = _interopRequireDefault(require("../native-stack/utils/getStatusBarHeight"));
var _ReanimatedHeaderHeightContext = _interopRequireDefault(require("./ReanimatedHeaderHeightContext"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); } // @ts-ignore file to be used only if `react-native-reanimated` available in the project
const AnimatedScreen = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeScreens.InnerScreen);

// We use prop added to global by reanimated since it seems safer than the one from RN. See:
// https://github.com/software-mansion/react-native-reanimated/blob/3fe8b35b05e82b2f2aefda1fb97799cf81e4b7bb/src/reanimated2/UpdateProps.ts#L46
// @ts-expect-error nativeFabricUIManager is not yet included in the RN types
const ENABLE_FABRIC = !!global?._IS_FABRIC;
const ReanimatedNativeStackScreen = /*#__PURE__*/_react.default.forwardRef((props, ref) => {
  const {
    children,
    ...rest
  } = props;
  const {
    stackPresentation = 'push',
    hasLargeHeader
  } = rest;
  const dimensions = (0, _reactNativeSafeAreaContext.useSafeAreaFrame)();
  const topInset = (0, _reactNativeSafeAreaContext.useSafeAreaInsets)().top;
  const isStatusBarTranslucent = rest.statusBarTranslucent ?? false;
  const statusBarHeight = (0, _getStatusBarHeight.default)(topInset, dimensions, isStatusBarTranslucent);

  // Default header height, normally used in `useHeaderHeight` hook.
  // Here, it is used for returning a default value for shared value.
  const defaultHeaderHeight = (0, _getDefaultHeaderHeight.default)(dimensions, statusBarHeight, stackPresentation, hasLargeHeader);
  const cachedHeaderHeight = _react.default.useRef(defaultHeaderHeight);
  const headerHeight = (0, _reactNativeReanimated.useSharedValue)(defaultHeaderHeight);
  const progress = (0, _reactNativeReanimated.useSharedValue)(0);
  const closing = (0, _reactNativeReanimated.useSharedValue)(0);
  const goingForward = (0, _reactNativeReanimated.useSharedValue)(0);
  return /*#__PURE__*/_react.default.createElement(AnimatedScreen
  // @ts-ignore some problems with ref and onTransitionProgressReanimated being "fake" prop for parsing of `useEvent` return value
  , _extends({
    ref: ref,
    onTransitionProgressReanimated: (0, _reactNativeReanimated.useEvent)(event => {
      'worklet';

      progress.value = event.progress;
      closing.value = event.closing;
      goingForward.value = event.goingForward;
    }, [
    // This should not be necessary, but is not properly managed by `react-native-reanimated`
    // @ts-ignore wrong type
    _reactNative.Platform.OS === 'android' ? 'onTransitionProgress' :
    // for some reason there is a difference in required event name between architectures
    ENABLE_FABRIC ? 'onTransitionProgress' : 'topTransitionProgress']),
    onHeaderHeightChangeReanimated: (0, _reactNativeReanimated.useEvent)(event => {
      'worklet';

      if (event.headerHeight !== cachedHeaderHeight.current) {
        headerHeight.value = event.headerHeight;
        cachedHeaderHeight.current = event.headerHeight;
      }
    }, [
    // @ts-ignore wrong type
    _reactNative.Platform.OS === 'android' ? 'onHeaderHeightChange' : ENABLE_FABRIC ? 'onHeaderHeightChange' : 'topHeaderHeightChange'])
  }, rest), /*#__PURE__*/_react.default.createElement(_ReanimatedHeaderHeightContext.default.Provider, {
    value: headerHeight
  }, /*#__PURE__*/_react.default.createElement(_ReanimatedTransitionProgressContext.default.Provider, {
    value: {
      progress,
      closing,
      goingForward
    }
  }, children)));
});
ReanimatedNativeStackScreen.displayName = 'ReanimatedNativeStackScreen';
var _default = exports.default = ReanimatedNativeStackScreen;
//# sourceMappingURL=ReanimatedNativeStackScreen.js.map